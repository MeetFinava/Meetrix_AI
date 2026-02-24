from fastapi import FastAPI
from app.routes.web_builder import router as web_builder_router

app = FastAPI()

app.include_router(web_builder_router, prefix="/api")