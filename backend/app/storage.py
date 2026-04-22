import re
import uuid
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
GENERATED_PROJECTS_DIR = BASE_DIR / "generated_projects"
GENERATED_ASSETS_DIR = BASE_DIR / "generated_assets"


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned or "item"


def unique_slug(value: str) -> str:
    return f"{slugify(value)}-{uuid.uuid4().hex[:8]}"


def ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path

