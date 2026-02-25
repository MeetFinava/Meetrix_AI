from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.web_builder import router as web_builder_router

app = FastAPI(
    title="Meetrix AI Backend",
    version="1.0.0",
    description="Multi-Model AI Web Builder Engine"
)

# ✅ CORS (important for future React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include Web Builder Routes
app.include_router(web_builder_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Meetrix AI Backend Running 🚀"}