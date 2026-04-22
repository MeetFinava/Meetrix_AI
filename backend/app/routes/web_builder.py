import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import ProjectRecord, UsageFeature, User
from app.rate_limit import enforce_rate_limit
from app.schemas.web_builder_schema import WebBuilderRequest
from app.services.blueprint_parser import extract_file_list
from app.services.blueprint_service import generate_blueprint
from app.services.file_generator_service import generate_file_content
from app.services.prompt_builder_service import generate_prompt_from_fields
from app.storage import GENERATED_PROJECTS_DIR, ensure_directory, unique_slug


router = APIRouter()


@router.post("/generate-prompt")
def generate_prompt(data: WebBuilderRequest, _current_user: User = Depends(get_current_user)):
    generated_prompt = generate_prompt_from_fields(data.dict())
    return {"generated_prompt": generated_prompt}


@router.post("/generate-blueprint")
def generate_blueprint_route(data: WebBuilderRequest, _current_user: User = Depends(get_current_user)):
    blueprint = generate_blueprint(data.dict())
    files = extract_file_list(blueprint)
    return {"blueprint": blueprint, "files": files}


@router.post("/build-project")
def build_project(
    data: WebBuilderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = getattr(data, "provider", "groq")
    usage = enforce_rate_limit(db, current_user, UsageFeature.project_build)
    project_slug = unique_slug(data.project_name)
    project_root = ensure_directory(GENERATED_PROJECTS_DIR) / project_slug

    def stream_builder():
        build_failed = False

        try:
            yield "Starting Project Build...\n\n"
            yield f"Usage Remaining Today: {usage['remaining']}\n\n"

            try:
                blueprint = generate_blueprint(data.dict(), provider=provider)
                files = extract_file_list(blueprint)
            except Exception as blueprint_error:
                yield f"Blueprint generation failed: {blueprint_error}\n"
                yield "\nBUILD FAILED\n"
                return

            os.makedirs(project_root, exist_ok=True)
            total_files = len(files)
            errors = 0

            for index, file_path in enumerate(files, start=1):
                normalized_path = file_path
                if normalized_path.startswith(data.project_name + "/"):
                    normalized_path = normalized_path.replace(data.project_name + "/", "", 1)

                yield f"Generating {index}/{total_files} -> {normalized_path}\n"

                full_path = Path(project_root) / normalized_path
                full_path.parent.mkdir(parents=True, exist_ok=True)

                try:
                    content = generate_file_content(
                        data.project_name,
                        normalized_path,
                        blueprint,
                        provider=provider,
                    )
                    full_path.write_text(content, encoding="utf-8")
                except Exception as file_error:
                    errors += 1
                    yield f"Error generating {normalized_path}: {file_error}\n"

            if errors > 0:
                build_failed = True
                yield f"\nBuild finished with {errors} file errors.\n"

            if not build_failed:
                try:
                    zip_path = str(Path(f"{project_root}.zip").resolve())
                    shutil.make_archive(str(project_root), "zip", str(project_root))
                    db.add(
                        ProjectRecord(
                            user_id=current_user.id,
                            project_name=data.project_name,
                            project_slug=project_slug,
                            project_path=str(Path(project_root).resolve()),
                            zip_path=zip_path,
                            blueprint_excerpt=blueprint[:3000],
                            request_payload=data.dict(),
                        )
                    )
                    db.commit()
                    yield "\nZIP Created Successfully\n"
                    yield f"DOWNLOAD_READY::{zip_path}\n"
                    yield "\nBUILD SUCCESS\n"
                except Exception as zip_error:
                    yield f"\nZIP creation failed: {zip_error}\n"
                    yield "\nBUILD FAILED\n"
            else:
                yield "\nBUILD FAILED\n"

        except Exception as fatal_error:
            yield f"\nFatal error occurred: {fatal_error}\n"
            yield "\nBUILD FAILED\n"

    return StreamingResponse(stream_builder(), media_type="text/plain")


@router.get("/download/{project_slug}")
def download_project(
    project_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(ProjectRecord).filter(ProjectRecord.project_slug == project_slug).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed to access this project")
    if not project.zip_path or not os.path.exists(project.zip_path):
        raise HTTPException(status_code=404, detail="ZIP file not found")

    return FileResponse(
        project.zip_path,
        media_type="application/zip",
        filename=f"{project.project_name}.zip",
    )
