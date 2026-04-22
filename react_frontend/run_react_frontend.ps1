$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Test-Path ".\\node_modules")) {
    throw "Dependencies are missing. Run npm.cmd install inside react_frontend first."
}

& "C:\Program Files\nodejs\npm.cmd" run dev
