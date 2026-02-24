from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas.web_builder_schema import WebBuilderRequest
from app.services.prompt_builder_service import generate_prompt_from_fields
from app.services.project_generator_service import generate_full_project_stream
from app.services.blueprint_service import generate_blueprint

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
# Step 2: Generate Project (Streaming)
# -----------------------------
@router.post("/generate-project")
def generate_project(request: dict):

    prompt = request.get("prompt")

    if not prompt:
        return {"error": "Prompt is required"}

    def token_generator():
        for token in generate_full_project_stream(prompt):
            yield token

    return StreamingResponse(token_generator(), media_type="text/plain")


from app.services.blueprint_parser import extract_file_list


@router.post("/generate-blueprint")
def generate_blueprint_route(data: WebBuilderRequest):

    blueprint = generate_blueprint(data.dict())

    files = extract_file_list(blueprint)

    return {
        "blueprint": blueprint,
        "files": files
    }

import os
from app.services.file_generator_service import generate_file_content

from app.services.zip_service import zip_project

from fastapi.responses import StreamingResponse
import shutil



@router.post("/build-project")
def build_project(data: WebBuilderRequest):

    def stream_builder():
        try:
            blueprint = generate_blueprint(data.dict())
            files = extract_file_list(blueprint)

            project_name = data.project_name
            base_path = f"generated_projects/{project_name}"
            os.makedirs(base_path, exist_ok=True)

            total_files = len(files)

            yield "🚀 Starting Project Build...\n\n"

            errors = 0

            for index, file_path in enumerate(files, start=1):

                if file_path.startswith(project_name + "/"):
                    file_path = file_path.replace(project_name + "/", "", 1)

                yield f"📄 Generating {index}/{total_files} → {file_path}\n"

                full_path = os.path.join(base_path, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)

                try:
                    content = generate_file_content(project_name, file_path, blueprint)

                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(content)

                except Exception as file_error:
                    errors += 1
                    yield f"❌ Error generating {file_path}: {str(file_error)}\n"

            if errors > 0:
                yield f"\n⚠️ Build finished with {errors} errors.\n"
            else:
                yield "\n✅ Project build completed successfully!\n"

            # ZIP CREATION
            try:
                zip_path = os.path.abspath(f"{base_path}.zip")
                shutil.make_archive(base_path, 'zip', base_path)

                yield f"\n📦 ZIP Created Successfully\n"
                yield f"DOWNLOAD_READY::{zip_path}\n"

            except Exception as zip_error:
                yield f"\n❌ ZIP creation failed: {str(zip_error)}\n"

        except Exception as fatal_error:
            yield f"\n💥 Fatal error occurred: {str(fatal_error)}\n"
            yield "\n❌ Build stopped unexpectedly.\n"

    return StreamingResponse(stream_builder(), media_type="text/plain")

from fastapi.responses import FileResponse

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