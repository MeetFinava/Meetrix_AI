import os
import zipfile


def zip_project(project_name: str) -> str:
    base_folder = f"generated_projects/{project_name}"
    zip_path = f"generated_projects/{project_name}.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_folder):
            for file in files:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, base_folder)
                zipf.write(full_path, relative_path)

    return zip_path