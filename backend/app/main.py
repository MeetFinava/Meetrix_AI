from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.database import Base, engine
from app.routes import image_generation, video_generation
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.chatbot import router as chatbot_router
from app.routes.web_builder import router as web_builder_router


app = FastAPI(
    title="Meetrix AI Backend",
    version="1.0.0",
    description="Multi-Model AI Web Builder Engine",
)


def _friendly_validation_message(exc: RequestValidationError) -> str:
    messages = []
    for error in exc.errors():
        field = " -> ".join(str(item) for item in error.get("loc", []) if item != "body")
        error_type = error.get("type", "")
        message = error.get("msg", "Invalid input")

        if error_type == "string_too_short":
            min_length = error.get("ctx", {}).get("min_length")
            if field:
                messages.append(f"{field.replace('_', ' ').title()} must be at least {min_length} characters.")
            else:
                messages.append(f"Input must be at least {min_length} characters.")
        elif error_type == "value_error" and field:
            messages.append(f"{field.replace('_', ' ').title()}: {message}")
        elif field:
            messages.append(f"{field.replace('_', ' ').title()}: {message}")
        else:
            messages.append(message)

    return " ".join(messages) or "Please check your input and try again."


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error_type": "validation_error",
            "message": _friendly_validation_message(exc),
            "suggestion": "Check the highlighted form fields and try again.",
            "details": exc.errors(),
        },
    )


@app.exception_handler(OperationalError)
async def operational_error_handler(_request: Request, _exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={
            "error_type": "database_error",
            "message": "The database is unavailable right now.",
            "suggestion": "Make sure PostgreSQL is running, then retry.",
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(_request: Request, _exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={
            "error_type": "database_error",
            "message": "A database error occurred while processing your request.",
            "suggestion": "Retry once. If it continues, check the backend and database logs.",
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, _exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error_type": "server_error",
            "message": "An unexpected backend error occurred.",
            "suggestion": "Retry in a moment. If it keeps happening, restart the backend.",
        },
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(web_builder_router, prefix="/api")
app.include_router(image_generation.router, prefix="/api/image")
app.include_router(video_generation.router, prefix="/api/video")
app.include_router(chatbot_router, prefix="/api/chat")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(admin_router, prefix="/api/admin")


@app.get("/")
def root():
    return {"message": "Meetrix AI Backend Running"}


@app.get("/health")
def health():
    return {"status": "ok"}
