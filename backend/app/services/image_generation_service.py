# backend/app/services/image_generation_service.py

import asyncio
from app.services.huggingface_service import query_huggingface_image

class ImageGenerationService:

    @staticmethod
    async def generate_image(data):
        # ✅ Run sync requests call in a thread so it doesn't block FastAPI's event loop
        loop = asyncio.get_event_loop()
        image_bytes = await loop.run_in_executor(
            None,
            lambda: query_huggingface_image(
                prompt=data.prompt,
                negative_prompt=data.negative_prompt,
                width=data.width,
                height=data.height
            )
        )
        return image_bytes