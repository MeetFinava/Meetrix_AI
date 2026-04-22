# backend/app/routes/video_generation.py
#
# Mirrors the exact pattern of image_generation.py.
# Returns:  GIF bytes  (Content-Type: image/gif)
# Endpoint: POST /api/video/generate-video

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.schemas.video_schema import VideoRequest
from app.services.video_generation_service import query_huggingface_video
import asyncio

router = APIRouter()


@router.post("/generate-video")
async def generate_video(data: VideoRequest):
    """
    Generate a short AI video from a text prompt.

    - Uses open-source ModelScope Text-to-Video 1.7B via HuggingFace Inference API
    - Returns an animated GIF (easy to display in browsers and Streamlit)
    - Same HF_API_KEY used for image generation — no extra key needed
    """
    try:
        loop = asyncio.get_event_loop()
        gif_bytes = await loop.run_in_executor(
            None,
            lambda: query_huggingface_video(
                prompt=data.prompt,
                negative_prompt=data.negative_prompt,
                num_frames=data.num_frames,
                num_inference_steps=data.num_inference_steps,
                guidance_scale=data.guidance_scale,
                width=data.width,
                height=data.height,
                fps=data.fps,
            )
        )
        return Response(content=gif_bytes, media_type="image/gif")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
