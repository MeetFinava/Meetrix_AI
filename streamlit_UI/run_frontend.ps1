$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Test-Path ".\.venv\Scripts\streamlit.exe")) {
    throw "Streamlit virtual environment not found at streamlit_UI/.venv"
}

& ".\.venv\Scripts\streamlit.exe" run app.py --server.port 8501
