from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.schemas.image_schema import ImageRequest
from app.services.image_generation_service import ImageGenerationService

router = APIRouter()

    
from fastapi import HTTPException

@router.post("/generate-image")
async def generate_image(data: ImageRequest):
    try:
        image_bytes = await ImageGenerationService.generate_image(data)
        return Response(content=image_bytes, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))