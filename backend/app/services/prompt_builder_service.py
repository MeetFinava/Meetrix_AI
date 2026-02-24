from langchain_core.messages import HumanMessage
from app.services.llm_config import llm
import json

def generate_prompt_from_fields(data: dict):
    structured_json = json.dumps(data, indent=2)

    instruction = f"""
    You are a senior full-stack architect.

    Convert the following JSON into a detailed, professional AI instruction
    for generating a complete production-ready web application.

    JSON:
    {structured_json}

    Include:
    - Folder structure
    - Tech stack clarification
    - Feature explanation
    - Clear generation instructions
    """

    response = llm.invoke([HumanMessage(content=instruction)])
    return response.content