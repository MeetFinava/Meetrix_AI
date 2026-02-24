from pydantic import BaseModel
from typing import List, Optional

class WebBuilderRequest(BaseModel):
    project_name: str
    website_type: str
    styling_framework: str
    theme: str
    frontend_framework: str
    backend_required: bool
    backend_framework: Optional[str] = None
    database: Optional[str] = None
    pages: List[str]
    authentication: bool
    payment_integration: bool
    admin_panel: bool