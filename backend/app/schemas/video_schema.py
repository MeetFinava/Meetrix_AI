from pydantic import BaseModel
from typing import Optional

class VideoRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    num_frames: int = 16          # Number of video frames (16 = ~2s at 8fps)
    num_inference_steps: int = 25  # Quality vs speed (higher = better but slower)
    guidance_scale: float = 7.5   # How closely to follow the prompt
    width: int = 512
    height: int = 320
    fps: int = 8                  # Frames per second for output GIF/video
