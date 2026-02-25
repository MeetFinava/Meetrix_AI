from app.services.groq_services import generate_from_groq
from app.services.huggingface_service import generate_from_hf

# def generate_response(prompt: str, provider: str = "groq"):
    
#     if provider == "groq":
#         try:
#             return generate_from_groq(prompt)
#         except Exception:
#             print("⚠ Groq failed. Switching to HuggingFace...")
#             return generate_from_hf(prompt)

#     elif provider == "huggingface":
#         return generate_from_hf(prompt)

#     else:
#         raise ValueError("Unsupported provider")

def generate_response(prompt: str, provider: str = "groq"):

    if provider == "groq":
        return generate_from_groq(prompt)

    else:
        raise ValueError("Currently only Groq supported")