import asyncio
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import AssetType, MediaAsset, UsageFeature, User
from app.rate_limit import enforce_rate_limit
from app.schemas.video_schema import VideoRequest
from app.services.video_generation_service import query_huggingface_video
from app.storage import GENERATED_ASSETS_DIR, ensure_directory


router = APIRouter()


@router.post("/generate-video")
async def generate_video(
    data: VideoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        usage = enforce_rate_limit(db, current_user, UsageFeature.video_generation)
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
            ),
        )

        output_dir = ensure_directory(GENERATED_ASSETS_DIR / "videos" / current_user.id)
        file_path = Path(output_dir) / f"{uuid.uuid4().hex}.gif"
        file_path.write_bytes(gif_bytes)

        db.add(
            MediaAsset(
                user_id=current_user.id,
                asset_type=AssetType.video,
                prompt=data.prompt,
                negative_prompt=data.negative_prompt,
                file_path=str(file_path.resolve()),
                mime_type="image/gif",
                width=data.width,
                height=data.height,
                metadata_json={
                    "num_frames": data.num_frames,
                    "num_inference_steps": data.num_inference_steps,
                    "guidance_scale": data.guidance_scale,
                    "fps": data.fps,
                    "usage_remaining": usage["remaining"],
                },
            )
        )
        db.commit()
        return Response(content=gif_bytes, media_type="image/gif")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
