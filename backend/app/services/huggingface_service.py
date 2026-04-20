# backend/app/services/huggingface_service.py

import os
import requests
from dotenv import load_dotenv

load_dotenv()

# ✅ Read key inside functions, NOT at module level
def _get_headers():
    key = os.getenv("HF_API_KEY")
    if not key:
        raise Exception("HF_API_KEY not found in environment variables")
    return {"Authorization": f"Bearer {key}"}


# ─── Text generation (unchanged logic, just uses _get_headers) ───────────────
def generate_from_hf(prompt: str, model: str = "mistralai/Mistral-7B-Instruct-v0.2"):
    API_URL = f"https://api-inference.huggingface.co/models/{model}"
    payload = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0.7,
            "max_new_tokens": 2048
        }
    }
    try:
        response = requests.post(API_URL, headers=_get_headers(), json=payload)
        response.raise_for_status()
        return response.json()[0]["generated_text"]
    except Exception as e:
        raise Exception(f"HuggingFace Error: {str(e)}")


# ─── Image generation ────────────────────────────────────────────────────────
# ✅ Updated to a working model on HF free inference API
#MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
MODEL_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"

def query_huggingface_image(prompt: str, negative_prompt=None, width=512, height=512):
    payload = {
        "inputs": prompt,
        "parameters": {}
    }

    # Only add optional params if provided (some models reject unknown params)
    if negative_prompt:
        payload["parameters"]["negative_prompt"] = negative_prompt
    if width:
        payload["parameters"]["width"] = width
    if height:
        payload["parameters"]["height"] = height

    try:
        response = requests.post(
            MODEL_URL,
            headers=_get_headers(),   # ✅ Key read at call time, not module load
            json=payload,
            timeout=120               # ✅ HF cold starts can take 60-90s
        )
    except requests.exceptions.Timeout:
        raise Exception("HuggingFace request timed out. Model may be loading — try again in 30 seconds.")

    content_type = response.headers.get("content-type", "")

    # ❌ Case 1: JSON error (model loading, quota exceeded, etc.)
    if "application/json" in content_type:
        try:
            data = response.json()
            error_msg = data.get("error", "Unknown HuggingFace error")
            # Give a user-friendly message for model loading
            if "loading" in error_msg.lower():
                raise Exception(f"Model is loading, please wait ~20 seconds and try again. ({error_msg})")
            raise Exception(error_msg)
        except ValueError:
            raise Exception("Invalid JSON response from HuggingFace")

    # ❌ Case 2: Not an image
    if "image" not in content_type:
        raise Exception(f"Unexpected response type: {content_type} | Body: {response.text[:300]}")

    # ✅ Case 3: Valid image bytes
    return response.content