from io import BytesIO
from pathlib import Path

from docx import Document
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader

from app.services.chat_document_service import get_chat_document_service

router = APIRouter()


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str


@router.post("/session")
def create_chat_session():
    service = get_chat_document_service()
    session_id = service.create_session()
    return {"session_id": session_id}


@router.post("/upload")
async def upload_document(session_id: str, file: UploadFile = File(...)):
    try:
        extension = Path(file.filename).suffix.lower()
        content = await file.read()
        text = extract_text(file_bytes=content, extension=extension)

        service = get_chat_document_service()
        chunks = service.add_document(session_id=session_id, filename=file.filename, text=text)

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
def ask_chatbot(data: ChatMessageRequest):
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        service = get_chat_document_service()
        return service.ask(session_id=data.session_id, message=data.message)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {error}")


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
