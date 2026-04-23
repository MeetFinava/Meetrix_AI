# Meetrix AI

A full-stack AI platform with a FastAPI backend and React (Vite) frontend. It provides a suite of AI-powered tools including a chatbot, image generation, video generation, a web builder, and an admin panel — all backed by Groq LLMs and Hugging Face models.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Configure environment variables](#2-configure-environment-variables)
  - [3. Set up a virtual environment](#3-set-up-a-virtual-environment)
    - [Option A — pip (standard)](#option-a--pip-standard)
    - [Option B — uv (recommended, faster)](#option-b--uv-recommended-faster)
  - [4. Run the backend](#4-run-the-backend)
- [Frontend Setup](#frontend-setup)
  - [1. Install dependencies](#1-install-dependencies)
  - [2. Run the frontend](#2-run-the-frontend)
- [API Documentation](#api-documentation)
- [Environment Variables Reference](#environment-variables-reference)
- [License](#license)

---

## Features

- 🤖 **AI Chatbot** — conversational AI powered by Groq's Llama 3.3 70B model, with document upload support (PDF, DOCX)
- 🖼️ **Image Generation** — generate images via Hugging Face inference API
- 🎬 **Video Generation** — generate short video clips using open-source models
- 🌐 **Web Builder** — AI-assisted HTML/CSS/JS project scaffolding and blueprint generation
- 🔐 **Authentication** — session-based auth with password hashing (310,000 PBKDF2 iterations)
- 🛡️ **Rate Limiting** — per-user request rate limiting
- 🗄️ **Admin Panel** — user management and system configuration dashboard
- ⚡ **REST API** — FastAPI with automatic OpenAPI/Swagger docs

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Backend   | Python 3.12, FastAPI, SQLAlchemy, Uvicorn           |
| AI / LLM  | Groq (Llama 3.3 70B), LangChain, Hugging Face API  |
| Database  | PostgreSQL (via psycopg3)                           |
| Frontend  | React 19, Vite, React Router v7, Framer Motion     |
| Styling   | Custom CSS (App.css / index.css)                   |

---

## Project Structure

```
Meetrix_AI/
├── backend/
│   ├── app/
│   │   ├── ai/                  # AI module init
│   │   ├── routes/              # API route handlers
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── chatbot.py
│   │   │   ├── image_generation.py
│   │   │   ├── video_generation.py
│   │   │   └── web_builder.py
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── services/            # Business logic & AI service clients
│   │   │   ├── chat_document_service.py
│   │   │   ├── groq_services.py
│   │   │   ├── huggingface_service.py
│   │   │   ├── image_generation_service.py
│   │   │   ├── video_generation_service.py
│   │   │   ├── web_builder_service.py
│   │   │   └── ...
│   │   ├── auth.py              # Auth helpers
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── dependencies.py      # FastAPI dependency injection
│   │   ├── main.py              # App entry point, middleware, routers
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── rate_limit.py        # Rate limiting logic
│   │   └── storage.py           # File storage utilities
│   ├── .env.example             # Environment variable template
│   ├── .python-version          # Python 3.12
│   └── pyproject.toml           # Project dependencies
│
└── react_frontend/
    ├── src/
    │   ├── components/          # Navbar, AuthModal
    │   ├── pages/
    │   │   ├── tools/           # ChatPage, ImagePage, VideoPage, WebBuilderPage
    │   │   ├── AdminPanel.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── ModelsPage.jsx
    │   │   ├── PricingPage.jsx
    │   │   ├── SettingsPage.jsx
    │   │   ├── APIPage.jsx
    │   │   └── ToolsPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## Prerequisites

Before starting, make sure you have the following installed:

- **Python 3.12** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** — [nodejs.org](https://nodejs.org/)
- **PostgreSQL** — running locally or accessible remotely
- **uv** *(optional but recommended)* — [docs.astral.sh/uv](https://docs.astral.sh/uv/)
- A **Groq API key** — [console.groq.com](https://console.groq.com/)
- A **Hugging Face API key** — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## Backend Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Meetrix_AI.git
cd Meetrix_AI/backend
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/meetrix_ai
SESSION_TTL_HOURS=24
PASSWORD_HASH_ITERATIONS=310000
GROQ_API_KEY=your_groq_api_key_here
HF_API_KEY=your_huggingface_api_key_here
OPEN_SOURCE_CHAT_MODEL=llama-3.3-70b-versatile
```

Make sure your PostgreSQL server is running and the database `meetrix_ai` exists:

```sql
CREATE DATABASE meetrix_ai;
```

---

### 3. Set up a virtual environment

#### Option A — pip (standard)

```bash
# Create a virtual environment
python -m venv .venv

# Activate it
# On macOS/Linux:
source .venv/bin/activate
# On Windows (CMD):
.venv\Scripts\activate
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .
```

#### Option B — uv (recommended, faster)

`uv` is a fast Python package manager. Install it once:

```bash
# macOS / Linux
curl -Ls https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Then create the venv and install dependencies:

```bash
# Create venv and install all dependencies from pyproject.toml
uv sync

# Activate the venv
# On macOS/Linux:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
```

> `uv sync` reads `pyproject.toml` and the `uv.lock` file to install exact pinned versions.

---

### 4. Run the backend

With the virtual environment activated, start the Uvicorn server from the `backend/` directory:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The `--reload` flag enables hot-reloading during development. Remove it in production.

The backend will be available at: **http://127.0.0.1:8000**

> **Note:** On first run, SQLAlchemy will automatically create all database tables defined in `app/models.py`.

---

## Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd Meetrix_AI/react_frontend
```

### 1. Install dependencies

```bash
npm install
```

### 2. Run the frontend

```bash
npm run dev
```

Vite will start a dev server, typically at: **http://localhost:5173**

Make sure the backend is running before using any AI features — the frontend calls the FastAPI server at `http://127.0.0.1:8000`.

To build for production:

```bash
npm run build
```

The output will be in `react_frontend/dist/`.

---

## API Documentation

Once the backend is running, interactive API docs are available at:

- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Main API Endpoints

| Method | Path                   | Description                       |
|--------|------------------------|-----------------------------------|
| POST   | `/auth/register`       | Register a new user               |
| POST   | `/auth/login`          | Login and create a session        |
| POST   | `/auth/logout`         | End the current session           |
| POST   | `/chatbot/chat`        | Send a message to the AI chatbot  |
| POST   | `/image/generate`      | Generate an image from a prompt   |
| POST   | `/video/generate`      | Generate a video from a prompt    |
| POST   | `/web-builder/build`   | Generate a web project blueprint  |
| GET    | `/admin/users`         | List all users (admin only)       |

---

## Environment Variables Reference

| Variable                  | Description                                        | Default                        |
|---------------------------|----------------------------------------------------|--------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string                       | *(required)*                   |
| `SESSION_TTL_HOURS`       | How long a user session stays valid (hours)        | `24`                           |
| `PASSWORD_HASH_ITERATIONS`| PBKDF2 iterations for password hashing            | `310000`                       |
| `GROQ_API_KEY`            | API key for Groq (LLM inference)                   | *(required)*                   |
| `HF_API_KEY`              | API key for Hugging Face (image/video generation)  | *(required)*                   |
| `OPEN_SOURCE_CHAT_MODEL`  | Groq model ID for the chatbot                      | `llama-3.3-70b-versatile`      |

---

## License

This project is licensed under the MIT License.
