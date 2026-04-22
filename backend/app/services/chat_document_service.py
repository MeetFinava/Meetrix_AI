import os
import re
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from groq import Groq
from langchain_text_splitters  import RecursiveCharacterTextSplitter


@dataclass  
class SessionState:
    session_id: str
    history: List[dict] = field(default_factory=list)
    chunks: List[str] = field(default_factory=list)
    source_files: List[str] = field(default_factory=list)


class DocumentChatService:
    """
    In-memory conversational RAG service.
    - Keeps per-session chat memory.
    - Stores and retrieves document chunks.
    - Uses Groq with open-source models (Llama/Qwen families).
    """

    def __init__(self) -> None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        self.client = Groq(api_key=api_key)
        self.model = os.getenv("OPEN_SOURCE_CHAT_MODEL", "llama-3.3-70b-versatile")
        self.sessions: Dict[str, SessionState] = {}
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=160,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = SessionState(session_id=session_id)
        return session_id

    def get_session(self, session_id: str) -> SessionState:
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState(session_id=session_id)
        return self.sessions[session_id]

    def add_document(self, session_id: str, filename: str, text: str) -> int:
        clean_text = text.strip()
        if not clean_text:
            return 0

        session = self.get_session(session_id)
        chunks = self.splitter.split_text(clean_text)
        session.chunks.extend(chunks)
        session.source_files.append(filename)
        return len(chunks)

    def _score_chunk(self, chunk: str, query_terms: set[str]) -> int:
        chunk_terms = set(re.findall(r"\w+", chunk.lower()))
        return len(query_terms.intersection(chunk_terms))

    def retrieve_context(self, session_id: str, query: str, top_k: int = 5) -> List[str]:
        session = self.get_session(session_id)
        if not session.chunks:
            return []

        query_terms = set(re.findall(r"\w+", query.lower()))
        scored = [
            (self._score_chunk(chunk, query_terms), idx, chunk)
            for idx, chunk in enumerate(session.chunks)
        ]
        scored.sort(key=lambda item: (item[0], -item[1]), reverse=True)

        best_chunks = [item[2] for item in scored[:top_k] if item[0] > 0]
        return best_chunks if best_chunks else session.chunks[: min(top_k, len(session.chunks))]

    def ask(self, session_id: str, message: str) -> dict:
        session = self.get_session(session_id)
        context_chunks = self.retrieve_context(session_id, message)

        context_block = "\n\n".join(
            [f"[DOC CHUNK {i + 1}]\n{chunk}" for i, chunk in enumerate(context_chunks)]
        )

        system_prompt = (
            "You are Meetrix AI assistant. Answer clearly and briefly. "
            "Use document context when available. "
            "If the answer is not in the context, say it is not present in uploaded files."
        )

        messages = [{"role": "system", "content": system_prompt}]

        for turn in session.history[-8:]:
            messages.append(turn)

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

        session.history.append({"role": "user", "content": message})
        session.history.append({"role": "assistant", "content": answer})

        return {
            "answer": answer,
            "session_id": session_id,
            "retrieved_chunks": len(context_chunks),
            "documents": session.source_files,
        }


chat_document_service: Optional[DocumentChatService] = None


def get_chat_document_service() -> DocumentChatService:
    global chat_document_service
    if chat_document_service is None:
        chat_document_service = DocumentChatService()
    return chat_document_service
