from fastapi import APIRouter
from fastapi.responses import StreamingResponse, FileResponse
from app.schemas.web_builder_schema import WebBuilderRequest
from app.services.prompt_builder_service import generate_prompt_from_fields
from app.services.blueprint_service import generate_blueprint
from app.services.blueprint_parser import extract_file_list
from app.services.file_generator_service import generate_file_content
from app.services.zip_service import zip_project
from app.services.llm_router import generate_response

import os
import shutil

router = APIRouter()

# -----------------------------
# Step 1: Generate Prompt Only
# -----------------------------
@router.post("/generate-prompt")
def generate_prompt(data: WebBuilderRequest):

    generated_prompt = generate_prompt_from_fields(data.dict())

    return {
        "generated_prompt": generated_prompt
    }


# -----------------------------
# Step 2: Generate Blueprint
# -----------------------------
@router.post("/generate-blueprint")
def generate_blueprint_route(data: WebBuilderRequest):

    blueprint = generate_blueprint(data.dict())

    files = extract_file_list(blueprint)

    return {
        "blueprint": blueprint,
        "files": files
    }


# -----------------------------
# Step 3: Build Project (Streaming)
# -----------------------------
@router.post("/build-project")
def build_project(data: WebBuilderRequest):

    provider = getattr(data, "provider", "groq")

    def stream_builder():
        build_failed = False

        try:
            yield "🚀 Starting Project Build...\n\n"

            # STEP 1: Generate Blueprint
            try:
                blueprint = generate_blueprint(data.dict(), provider=provider)
                files = extract_file_list(blueprint)
            except Exception as blueprint_error:
                build_failed = True
                yield f"💥 Blueprint generation failed: {str(blueprint_error)}\n"
                yield "\n❌ BUILD FAILED\n"
                return

            project_name = data.project_name
            base_path = f"generated_projects/{project_name}"
            os.makedirs(base_path, exist_ok=True)

            total_files = len(files)
            errors = 0

            # STEP 2: Generate Files
            for index, file_path in enumerate(files, start=1):

                if file_path.startswith(project_name + "/"):
                    file_path = file_path.replace(project_name + "/", "", 1)

                yield f"📄 Generating {index}/{total_files} → {file_path}\n"

                full_path = os.path.join(base_path, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)

                try:
                    content = generate_file_content(
                        project_name,
                        file_path,
                        blueprint,
                        provider=provider
                    )

                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(content)

                except Exception as file_error:
                    errors += 1
                    yield f"❌ Error generating {file_path}: {str(file_error)}\n"

            if errors > 0:
                build_failed = True
                yield f"\n⚠️ Build finished with {errors} file errors.\n"

            # STEP 3: ZIP CREATION
            if not build_failed:
                try:
                    zip_path = os.path.abspath(f"{base_path}.zip")
                    shutil.make_archive(base_path, 'zip', base_path)

                    yield "\n📦 ZIP Created Successfully\n"
                    yield f"DOWNLOAD_READY::{zip_path}\n"
                    yield "\n✅ BUILD SUCCESS\n"

                except Exception as zip_error:
                    build_failed = True
                    yield f"\n❌ ZIP creation failed: {str(zip_error)}\n"
                    yield "\n❌ BUILD FAILED\n"
            else:
                yield "\n❌ BUILD FAILED\n"

        except Exception as fatal_error:
            yield f"\n💥 Fatal error occurred: {str(fatal_error)}\n"
            yield "\n❌ BUILD FAILED\n"

    return StreamingResponse(stream_builder(), media_type="text/plain")

# -----------------------------
# Step 4: Download ZIP
# -----------------------------
@router.get("/download/{project_name}")
def download_project(project_name: str):

    zip_path = os.path.abspath(f"generated_projects/{project_name}.zip")

    if not os.path.exists(zip_path):
        return {"error": "ZIP file not found"}

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"{project_name}.zip"
    )