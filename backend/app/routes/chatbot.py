from io import BytesIO
from pathlib import Path

from docx import Document
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import ChatMessage, UsageFeature, User
from app.rate_limit import enforce_rate_limit
from app.services.chat_document_service import get_chat_document_service


router = APIRouter()


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str


@router.post("/session")
def create_chat_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = get_chat_document_service()
    session = service.create_session(db=db, user=current_user)
    return {"session_id": session.id, "title": session.title}


@router.post("/upload")
async def upload_document(
    session_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        enforce_rate_limit(db, current_user, UsageFeature.document_upload)
        extension = Path(file.filename).suffix.lower()
        content = await file.read()
        text = extract_text(file_bytes=content, extension=extension)

        service = get_chat_document_service()
        session = service.get_session(db=db, session_id=session_id, user=current_user)
        chunks = service.add_document(db=db, session=session, filename=file.filename, text=text)

        if chunks == 0:
            raise HTTPException(status_code=400, detail="No readable text found in file")

        return {
            "session_id": session_id,
            "filename": file.filename,
            "chunks_indexed": chunks,
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {error}")


@router.post("/message")
def ask_chatbot(
    data: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        enforce_rate_limit(db, current_user, UsageFeature.chat_message)
        service = get_chat_document_service()
        session = service.get_session(db=db, session_id=data.session_id, user=current_user)
        return service.ask(db=db, session=session, message=data.message)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {error}")


@router.get("/history/{session_id}")
def get_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = get_chat_document_service()
    session = service.get_session(db=db, session_id=session_id, user=current_user)
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "session_id": session.id,
        "title": session.title,
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }


def extract_text(file_bytes: bytes, extension: str) -> str:
    if extension == ".pdf":
        reader = PdfReader(BytesIO(file_bytes))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if extension in {".txt", ".md", ".py", ".js", ".ts", ".json", ".csv"}:
        return file_bytes.decode("utf-8", errors="ignore")

    if extension == ".docx":
        doc = Document(BytesIO(file_bytes))
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Use PDF, DOCX, TXT, MD, PY, JS, TS, JSON, or CSV.",
    )
