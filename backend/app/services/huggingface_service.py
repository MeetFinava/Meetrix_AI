import os
import requests

HF_API_KEY = os.getenv("HF_API_KEY")

def generate_from_hf(prompt: str, model: str = "mistralai/Mistral-7B-Instruct-v0.2"):
    API_URL = f"https://api-inference.huggingface.co/models/{model}"

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}"
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0.7,
            "max_new_tokens": 2048
        }
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()[0]["generated_text"]

    except Exception as e:
        raise Exception(f"HuggingFace Error: {str(e)}")