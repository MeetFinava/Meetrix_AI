from langchain_core.messages import HumanMessage
from app.services.llm_config import llm


def generate_file_content(project_name: str, file_path: str, blueprint: str) -> str:
    instruction = f"""
You are a senior software engineer.

Project Name: {project_name}

Project Blueprint:
{blueprint}

Generate COMPLETE production-ready code for this file:

File Path:
{file_path}

Rules:
- Return ONLY code.
- No markdown.
- No explanation.
- No comments like TODO.
- Must be syntactically correct.
- Include all necessary imports.
"""

    response = llm.invoke([HumanMessage(content=instruction)])
    return response.content