import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import AssetType, MediaAsset, UsageFeature, User
from app.rate_limit import enforce_rate_limit
from app.schemas.image_schema import ImageRequest
from app.services.image_generation_service import ImageGenerationService
from app.storage import GENERATED_ASSETS_DIR, ensure_directory


router = APIRouter()


@router.post("/generate-image")
async def generate_image(
    data: ImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        usage = enforce_rate_limit(db, current_user, UsageFeature.image_generation)
        image_bytes = await ImageGenerationService.generate_image(data)

        output_dir = ensure_directory(GENERATED_ASSETS_DIR / "images" / current_user.id)
        file_path = Path(output_dir) / f"{uuid.uuid4().hex}.png"
        file_path.write_bytes(image_bytes)

        db.add(
            MediaAsset(
                user_id=current_user.id,
                asset_type=AssetType.image,
                prompt=data.prompt,
                negative_prompt=data.negative_prompt,
                file_path=str(file_path.resolve()),
                mime_type="image/png",
                width=data.width,
                height=data.height,
                metadata_json={"usage_remaining": usage["remaining"]},
            )
        )
        db.commit()
        return Response(content=image_bytes, media_type="image/png")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
