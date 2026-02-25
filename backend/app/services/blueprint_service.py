from app.services.llm_router import generate_response


def generate_blueprint(data: dict, provider: str = "groq") -> str:
    instruction = f"""
You are a senior full-stack architect.

User Configuration:
{data}

Your task:

Generate a REAL resolved project architecture.

Rules:
- Replace ALL placeholders with actual values.
- Determine correct file extensions (.tsx, .js, .py, .scss, etc.)
- If backend_required is false, DO NOT include server folder.
- If backend_required is true, include proper backend structure.
- If frontend is React + TypeScript, use .tsx.
- If styling is Bootstrap, use .scss or .css accordingly.

Return ONLY:

# Project Name
<actual name>

# Tech Stack Summary
(bullet points)

# Clean Folder Structure
(real structure, no placeholders)

### FILE_LIST
One file path per line.
NO placeholders.
NO angle brackets.
NO explanation.
NO extra text.
"""

    blueprint = generate_response(instruction, provider)

    return blueprint