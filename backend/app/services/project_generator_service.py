from langchain_core.messages import HumanMessage
from typing import Iterator
from app.services.llm_config import llm


def generate_full_project_stream(prompt: str) -> Iterator[str]:
    instruction = f"""
    You are an expert full-stack developer.

    Generate the complete project based on this instruction:

    {prompt}

    Return:
    1. Folder Structure
    2. All Files with filenames clearly separated
    3. Setup Instructions
    4. If large, divide in steps
    """

    # Direct streaming (no callbacks needed)
    for chunk in llm.stream([HumanMessage(content=instruction)]):
        if chunk.content:
            yield chunk.content