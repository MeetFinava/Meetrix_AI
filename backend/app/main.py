# backend/app/main.py  (UPDATED — adds video generation route)
from dotenv import load_dotenv
load_dotenv()  # ← Must be BEFORE any imports that read env vars

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.web_builder import router as web_builder_router
from app.routes import image_generation
from app.routes import video_generation          # ← NEW
from app.routes.chatbot import router as chatbot_router

app = FastAPI(
    title="Meetrix AI Backend",
    version="1.0.0",
    description="Multi-Model AI Web Builder Engine"
)

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Routers
app.include_router(web_builder_router,          prefix="/api")
app.include_router(image_generation.router,     prefix="/api/image")
app.include_router(video_generation.router,     prefix="/api/video")   # ← NEW
app.include_router(chatbot_router,              prefix="/api/chat")


@app.get("/")
def root():
    return {"message": "Meetrix AI Backend Running 🚀"}

