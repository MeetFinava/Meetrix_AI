import os
import re
from typing import List

from fastapi import HTTPException, status
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from app.models import ChatDocument, ChatMessage, ChatSessionRecord, User


class DocumentChatService:
    """
    Database-backed conversational RAG service.
    - Stores chat sessions, uploaded documents, and messages in PostgreSQL.
    - Retrieves context from persisted documents per user session.
    """

    def __init__(self) -> None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        self.client = Groq(api_key=api_key)
        self.model = os.getenv("OPEN_SOURCE_CHAT_MODEL", "llama-3.3-70b-versatile")
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=160,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def create_session(self, db: Session, user: User, title: str | None = None) -> ChatSessionRecord:
        session = ChatSessionRecord(user_id=user.id, title=(title or "New Conversation")[:255])
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_session(self, db: Session, session_id: str, user: User) -> ChatSessionRecord:
        session = (
            db.query(ChatSessionRecord)
            .filter(ChatSessionRecord.id == session_id, ChatSessionRecord.user_id == user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        return session

    def add_document(
        self,
        db: Session,
        session: ChatSessionRecord,
        filename: str,
        text: str,
    ) -> int:
        clean_text = text.strip()
        if not clean_text:
            return 0

        chunks = self.splitter.split_text(clean_text)
        document = ChatDocument(
            chat_session_id=session.id,
            filename=filename[:255],
            extracted_text=clean_text,
            chunk_count=len(chunks),
        )
        db.add(document)
        db.commit()
        return len(chunks)

    def _score_chunk(self, chunk: str, query_terms: set[str]) -> int:
        chunk_terms = set(re.findall(r"\w+", chunk.lower()))
        return len(query_terms.intersection(chunk_terms))

    def retrieve_context(self, db: Session, session: ChatSessionRecord, query: str, top_k: int = 5) -> List[str]:
        documents = (
            db.query(ChatDocument)
            .filter(ChatDocument.chat_session_id == session.id)
            .order_by(ChatDocument.created_at.asc())
            .all()
        )
        if not documents:
            return []

        chunks: list[str] = []
        for document in documents:
            chunks.extend(self.splitter.split_text(document.extracted_text))

        query_terms = set(re.findall(r"\w+", query.lower()))
        scored = [
            (self._score_chunk(chunk, query_terms), idx, chunk)
            for idx, chunk in enumerate(chunks)
        ]
        scored.sort(key=lambda item: (item[0], -item[1]), reverse=True)

        best_chunks = [item[2] for item in scored[:top_k] if item[0] > 0]
        return best_chunks if best_chunks else chunks[: min(top_k, len(chunks))]

    def ask(self, db: Session, session: ChatSessionRecord, message: str) -> dict:
        context_chunks = self.retrieve_context(db, session, message)
        source_files = [
            item.filename
            for item in db.query(ChatDocument)
            .filter(ChatDocument.chat_session_id == session.id)
            .order_by(ChatDocument.created_at.asc())
            .all()
        ]

        history = (
            db.query(ChatMessage)
            .filter(ChatMessage.chat_session_id == session.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

        context_block = "\n\n".join(
            [f"[DOC CHUNK {i + 1}]\n{chunk}" for i, chunk in enumerate(context_chunks)]
        )

        system_prompt = (
            "You are Meetrix AI assistant. Answer clearly and briefly. "
            "Use document context when available. "
            "If the answer is not in the context, say it is not present in uploaded files."
        )

        messages = [{"role": "system", "content": system_prompt}]
        for turn in history[-8:]:
            messages.append({"role": turn.role, "content": turn.content})

        user_payload = message
        if context_block:
            user_payload = (
                f"User question:\n{message}\n\n"
                f"Document context:\n{context_block}\n\n"
                "Answer based on context and conversation memory."
            )

        messages.append({"role": "user", "content": user_payload})

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.2,
        )

        answer = completion.choices[0].message.content

        db.add(ChatMessage(chat_session_id=session.id, role="user", content=message))
        db.add(
            ChatMessage(
                chat_session_id=session.id,
                role="assistant",
                content=answer,
                retrieved_chunks=len(context_chunks),
                documents_json=source_files,
            )
        )
        if session.title == "New Conversation":
            session.title = message[:80]
        db.commit()
        db.refresh(session)

        return {
            "answer": answer,
            "session_id": session.id,
            "retrieved_chunks": len(context_chunks),
            "documents": source_files,
            "title": session.title,
        }


chat_document_service: DocumentChatService | None = None


def get_chat_document_service() -> DocumentChatService:
    global chat_document_service
    if chat_document_service is None:
        chat_document_service = DocumentChatService()
    return chat_document_service
