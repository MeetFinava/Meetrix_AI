def build_project(idea: str):
    return {
        "project_name": "generated_project",
        "description": idea,
        "architecture": {
            "frontend": "Next.js",
            "backend": "FastAPI",
            "database": "PostgreSQL"
        },
        "features": [
            "Authentication",
            "CRUD APIs",
            "Responsive UI"
        ]
    }