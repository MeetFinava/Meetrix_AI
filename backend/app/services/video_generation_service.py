# backend/app/services/video_generation_service.py
#
# Uses the HuggingFace Inference API (same HF_API_KEY you already have)
#
# ✅ FIXED v2: Uses only models confirmed working on FREE hf-inference tier
# ✅ FIXED: Proper error handling for all response types (JSON, HTML, plain text)
# ✅ FIXED: router.huggingface.co endpoint format
#
# Free-tier working models (as of April 2026):
#   Primary:  damo-vilab/text-to-video-ms-1.7b   (ModelScope, Apache 2.0)
#   Fallback: ali-vilab/text-to-video-ms-1.7b    (same weights, different org)
#
# The API returns raw MP4 bytes when successful.
# We convert them to an animated GIF in-memory so the browser/Streamlit
# can display them without any extra codec dependency.

import os
import io
import requests
from dotenv import load_dotenv

load_dotenv()

# ─── Free-tier models via router.huggingface.co ──────────────────────────────
# ⚠️  Do NOT use Wan2.1-T2V-14B — requires PRO/paid account
# ⚠️  Do NOT use api-inference.huggingface.co — deprecated for video models
PRIMARY_MODEL_URL  = "https://router.huggingface.co/hf-inference/models/damo-vilab/text-to-video-ms-1.7b"
FALLBACK_MODEL_URL = "https://router.huggingface.co/hf-inference/models/ali-vilab/text-to-video-ms-1.7b"


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _get_headers():
    key = os.getenv("HF_API_KEY")
    if not key:
        raise Exception("HF_API_KEY not found in environment variables")
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "x-use-cache": "0",
    }


def _mp4_bytes_to_gif(mp4_bytes: bytes, fps: int = 8) -> bytes:
    """
    Convert raw MP4 bytes → animated GIF bytes using imageio + Pillow.
    Everything in-memory, no temp files needed.
    """
    try:
        import imageio.v3 as iio
        from PIL import Image

        reader = iio.imopen(io.BytesIO(mp4_bytes), "r", plugin="pyav")
        frames_raw = reader.read()   # shape: (N, H, W, C) uint8

        pil_frames = [Image.fromarray(f) for f in frames_raw]

        gif_buf = io.BytesIO()
        pil_frames[0].save(
            gif_buf,
            format="GIF",
            save_all=True,
            append_images=pil_frames[1:],
            loop=0,
            duration=int(1000 / fps),
            optimize=False,
        )
        gif_buf.seek(0)
        return gif_buf.read()

    except Exception as e:
        raise Exception(
            f"Failed to convert MP4 to GIF: {str(e)}\n"
            "Make sure imageio[pyav] and Pillow are installed.\n"
            "Run: uv add 'imageio[pyav]' Pillow"
        )


def _parse_hf_error(response: requests.Response) -> str:
    """Extract a readable error message from any HF response type."""
    content_type = response.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            data = response.json()
            return data.get("error", str(data))
        except Exception:
            pass

    if "text/html" in content_type:
        return (
            f"HuggingFace returned an HTML error page (HTTP {response.status_code}). "
            "The model endpoint URL may be wrong, or the model is not available on the free tier."
        )

    return response.text[:400] or f"HTTP {response.status_code}"


def _is_video_bytes(content: bytes, content_type: str) -> bool:
    """Check if the response body looks like valid video data."""
    if "video" in content_type:
        return True
    if len(content) > 8:
        magic = content[:8]
        if b"ftyp" in magic:
            return True
        if magic[:4] in (b'\x00\x00\x00\x18', b'\x00\x00\x00\x1c', b'\x00\x00\x00\x20'):
            return True
    return False


def query_huggingface_video(
    prompt: str,
    negative_prompt: str | None = None,
    num_frames: int = 16,
    num_inference_steps: int = 25,
    guidance_scale: float = 7.5,
    width: int = 256,    # ⚠️ Keep small — 1.7B model OOMs at 512 on free GPU
    height: int = 256,
    fps: int = 8,
) -> bytes:
    """
    Calls HuggingFace Inference API to generate a short video.
    Returns animated GIF bytes (displayable in browser / Streamlit st.image).

    API key required: HF_API_KEY  (same one used for image generation).
    Token must have: "Make calls to Inference Providers" (already set in your token).
    """
    payload: dict = {
        "inputs": prompt,
        "parameters": {
            "num_frames":           num_frames,
            "num_inference_steps":  num_inference_steps,
            "guidance_scale":       guidance_scale,
            "width":                width,
            "height":               height,
        }
    }
    if negative_prompt:
        payload["parameters"]["negative_prompt"] = negative_prompt

    headers = _get_headers()
    last_error = "Unknown error"

    for model_url in [PRIMARY_MODEL_URL, FALLBACK_MODEL_URL]:
        model_name = model_url.split("/models/")[-1]

        try:
            response = requests.post(
                model_url,
                headers=headers,
                json=payload,
                timeout=300,
            )
        except requests.exceptions.Timeout:
            raise Exception(
                "HuggingFace request timed out. "
                "Video generation can take up to 3 minutes on cold start — please retry."
            )
        except requests.exceptions.ConnectionError as e:
            last_error = f"Connection error for {model_name}: {str(e)}"
            continue

        content_type = response.headers.get("content-type", "")

        # ✅ Valid video bytes
        if _is_video_bytes(response.content, content_type):
            return _mp4_bytes_to_gif(response.content, fps=fps)

        # ❌ Parse error and decide next step
        error_msg = _parse_hf_error(response)
        last_error = f"[{model_name}] {error_msg}"

        # Model loading → try fallback immediately
        if "loading" in error_msg.lower() or response.status_code == 503:
            continue

        # Model not supported on this provider → try fallback
        if "not supported" in error_msg.lower() or response.status_code in (404, 422):
            continue

        # HTML error page → try fallback
        if "text/html" in content_type:
            continue

        # Primary failed for other reason → still try fallback
        if model_url == PRIMARY_MODEL_URL:
            continue

        # Fallback also failed with a hard error
        raise Exception(f"HuggingFace Video API Error: {error_msg}")

    raise Exception(
        f"Both video models failed.\n\nLast error: {last_error}\n\n"
        "Troubleshooting:\n"
        "1. Your HF token permissions look correct (Inference Providers is checked)\n"
        "2. Free-tier GPU capacity may be exhausted — retry in 2-5 minutes\n"
        "3. Try reducing num_frames to 8 and resolution to 256x256\n"
        "4. Check https://status.huggingface.co for outages"
    )
