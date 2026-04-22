from pathlib import Path

import requests
import streamlit as st


BACKEND_URL = "http://localhost:8000/api"

st.set_page_config(page_title="Meetrix AI", layout="wide")

st.markdown(
    """
<style>
.card {
    padding: 25px;
    border-radius: 18px;
    background-color: #111827;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: 0.3s ease-in-out;
    height: 230px;
}
.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
}
.card-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 10px;
}
.card-desc {
    font-size: 14px;
    color: #9CA3AF;
    margin-bottom: 15px;
}
.stButton>button {
    border-radius: 10px;
    width: 100%;
}
</style>
""",
    unsafe_allow_html=True,
)


def init_state():
    defaults = {
        "current_page": "home",
        "auth_token": None,
        "user": None,
        "chat_session_id": None,
        "chat_messages": [],
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def go_to(page: str):
    st.session_state.current_page = page
    st.rerun()


def auth_headers() -> dict:
    token = st.session_state.get("auth_token")
    return {"Authorization": f"Bearer {token}"} if token else {}


def api_request(method: str, path: str, **kwargs):
    headers = kwargs.pop("headers", {})
    merged_headers = {**auth_headers(), **headers}
    return requests.request(method, f"{BACKEND_URL}{path}", headers=merged_headers, timeout=kwargs.pop("timeout", 120), **kwargs)


def backend_available() -> bool:
    try:
        response = requests.get("http://localhost:8000/health", timeout=3)
        return response.status_code == 200
    except requests.RequestException:
        return False


def parse_api_error(response) -> tuple[str, str | None]:
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if isinstance(payload, list):
        return ("The server returned an unexpected error format.", "Please retry. If it continues, check the backend logs.")

    message = payload.get("message") or payload.get("detail")
    suggestion = payload.get("suggestion")

    if isinstance(message, list):
        parts = []
        for item in message:
            if isinstance(item, dict):
                parts.append(item.get("msg", "Invalid input"))
        message = " ".join(parts)

    if not message and response.status_code == 401:
        message = "Authentication failed."
        suggestion = "Check your email and password, then try again."
    elif not message and response.status_code == 422:
        message = "Some form fields are invalid."
        suggestion = "Review your entries and try again."
    elif not message and response.status_code >= 500:
        message = "The backend returned an internal error."
        suggestion = "Retry in a moment. If it continues, restart the backend."
    elif not message:
        message = response.text or "Request failed."

    return message, suggestion


def show_api_error(response, fallback_title: str):
    message, suggestion = parse_api_error(response)
    st.error(f"{fallback_title}: {message}")
    if suggestion:
        st.info(f"Suggestion: {suggestion}")


def show_request_exception(error: Exception, fallback_title: str):
    if isinstance(error, requests.ConnectionError):
        st.error(f"{fallback_title}: Cannot connect to the backend.")
        st.info("Suggestion: Start the FastAPI backend and confirm it is running on http://localhost:8000.")
        return
    if isinstance(error, requests.Timeout):
        st.error(f"{fallback_title}: The request timed out.")
        st.info("Suggestion: Retry once. If it keeps timing out, check the backend service or reduce the workload.")
        return

    st.error(f"{fallback_title}: {error}")
    st.info("Suggestion: Retry once. If it continues, check whether this is a frontend or backend issue.")


def handle_auth_response(response):
    payload = response.json()
    st.session_state.auth_token = payload["token"]
    st.session_state.user = payload["user"]
    st.session_state.chat_session_id = None
    st.session_state.chat_messages = []
    go_to("home")


def show_auth_page():
    st.title("Meetrix AI Login")
    st.caption("Create an account to save projects, images, videos, and conversations.")
    if not backend_available():
        st.warning("Backend offline. Start the FastAPI server before logging in or registering.")
        st.code("cd d:\\Meetrix_AI\\backend\n.\\run_backend.ps1")

    login_tab, register_tab = st.tabs(["Login", "Register"])

    with login_tab:
        with st.form("login_form"):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            submitted = st.form_submit_button("Login")

        if submitted:
            try:
                response = api_request("POST", "/auth/login", json={"email": email, "password": password}, timeout=30)
                if response.status_code == 200:
                    handle_auth_response(response)
                else:
                    show_api_error(response, "Login failed")
            except Exception as error:
                show_request_exception(error, "Login failed")

    with register_tab:
        with st.form("register_form"):
            full_name = st.text_input("Full Name")
            email = st.text_input("Email", key="register_email")
            password = st.text_input("Password", type="password", key="register_password")
            submitted = st.form_submit_button("Create Account")

        if submitted:
            if len(password) < 8:
                st.error("Registration failed: Password must be at least 8 characters.")
                st.info("Suggestion: Use a stronger password like `meet1234` or `Password123!`.")
                return
            try:
                response = api_request(
                    "POST",
                    "/auth/register",
                    json={"full_name": full_name, "email": email, "password": password},
                    timeout=30,
                )
                if response.status_code == 200:
                    handle_auth_response(response)
                else:
                    show_api_error(response, "Registration failed")
            except Exception as error:
                show_request_exception(error, "Registration failed")


def logout():
    try:
        api_request("POST", "/auth/logout", timeout=30)
    except Exception:
        pass
    st.session_state.auth_token = None
    st.session_state.user = None
    st.session_state.chat_session_id = None
    st.session_state.chat_messages = []
    go_to("auth")


def require_auth() -> bool:
    if not st.session_state.get("auth_token"):
        show_auth_page()
        return False
    return True


def render_sidebar():
    with st.sidebar:
        st.title("Meetrix AI")
        user = st.session_state.get("user") or {}
        st.write(user.get("full_name", "Unknown User"))
        st.caption(user.get("email", ""))

        pages = {
            "home": "Home",
            "web_builder": "Web Builder",
            "image_generation": "Image Generation",
            "video_generation": "Video Generation",
            "rag_chat": "Chat with PDF",
            "history": "My History",
        }

        if user.get("is_admin"):
            pages["admin"] = "Admin"

        for key, label in pages.items():
            if st.button(label, key=f"nav_{key}"):
                go_to(key)

        if st.button("Logout", key="logout"):
            logout()


def show_home():
    st.title("Meetrix AI Platform")
    st.write("Multi-Feature AI Suite")

    col1, col2, col3 = st.columns(3)
    features = [
        ("Web Builder", "Generate full-stack apps instantly.", "web_builder"),
        ("Image Generation", "AI image creation engine.", "image_generation"),
        ("Video Generation", "Generate AI videos from text.", "video_generation"),
        ("Chat with PDF", "Ask questions from documents with saved history.", "rag_chat"),
        ("My History", "See your projects, media, and conversations.", "history"),
    ]

    columns = [col1, col2, col3]
    for index, (title, desc, key) in enumerate(features):
        with columns[index % 3]:
            st.markdown(
                f"""
                <div class="card">
                    <div class="card-title">{title}</div>
                    <div class="card-desc">{desc}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            if st.button("Open", key=key):
                go_to(key)


def show_web_builder():
    st.title("Web Builder")

    with st.form("web_builder_form"):
        col1, col2 = st.columns(2)

        with col1:
            project_name = st.text_input("Project Name")
            website_type = st.selectbox("Website Type", ["Hospital", "E-commerce", "Portfolio", "Gym", "School", "SaaS"])
            styling_framework = st.selectbox("Styling Framework", ["CSS", "Bootstrap", "Tailwind"])
            theme = st.selectbox("Theme", ["Modern", "Minimal", "Dark", "Corporate"])
            frontend_framework = st.selectbox("Frontend Framework", ["HTML", "React", "Next.js"])

        with col2:
            backend_required = st.radio("Backend Required?", ["Yes", "No"])
            backend_framework = None
            database = None
            if backend_required == "Yes":
                backend_framework = st.selectbox("Backend Framework", ["FastAPI", "Node.js", "Django"])
                database = st.selectbox("Database", ["PostgreSQL", "SQLite", "MongoDB"])

            pages = st.multiselect("Select Pages", ["Home", "About", "Contact", "Services", "Blog", "Login", "Dashboard"])
            authentication = st.checkbox("Authentication")
            payment_integration = st.checkbox("Payment Integration")
            admin_panel = st.checkbox("Admin Panel")

        submitted = st.form_submit_button("Generate & Build")

    if submitted:
        payload = {
            "project_name": project_name,
            "website_type": website_type,
            "styling_framework": styling_framework,
            "theme": theme,
            "frontend_framework": frontend_framework,
            "backend_required": backend_required == "Yes",
            "backend_framework": backend_framework,
            "database": database,
            "pages": pages,
            "authentication": authentication,
            "payment_integration": payment_integration,
            "admin_panel": admin_panel,
        }

        st.subheader("Building Project Live...")
        try:
            response = api_request("POST", "/build-project", json=payload, stream=True, timeout=360)
            if response.status_code != 200:
                show_api_error(response, "Project build failed")
                return

            output_area = st.empty()
            log_text = ""
            build_success = False

            for chunk in response.iter_content(chunk_size=1024):
                if not chunk:
                    continue
                decoded = chunk.decode("utf-8")
                log_text += decoded
                if "BUILD SUCCESS" in log_text:
                    build_success = True
                output_area.text(log_text)

            if build_success:
                st.success("Project Build Completed Successfully")
                history = api_request("GET", "/auth/history", timeout=30).json()
                latest_project = history["projects"][0] if history["projects"] else None
                if latest_project:
                    download_response = api_request(
                        "GET",
                        f"/download/{latest_project['project_slug']}",
                        timeout=120,
                    )
                    if download_response.status_code == 200:
                        st.download_button(
                            label="Download Project ZIP",
                            data=download_response.content,
                            file_name=f"{latest_project['project_name']}.zip",
                            mime="application/zip",
                        )
            else:
                st.error("Project Build Failed")
        except Exception as error:
            show_request_exception(error, "Project build failed")


def show_image_generation():
    st.title("Image Generation")

    with st.form("image_form"):
        prompt = st.text_area("Enter Prompt", placeholder="A futuristic hospital UI design, modern, clean...")
        col1, col2 = st.columns(2)
        with col1:
            width = st.selectbox("Width", [256, 512, 768], index=1)
        with col2:
            height = st.selectbox("Height", [256, 512, 768], index=1)
        negative_prompt = st.text_input("Negative Prompt (optional)", placeholder="blurry, low quality")
        submitted = st.form_submit_button("Generate Image")

    if submitted:
        if not prompt.strip():
            st.warning("Please enter a prompt")
            return

        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
        }

        with st.spinner("AI is creating your image..."):
            try:
                response = api_request("POST", "/image/generate-image", json=payload, timeout=240)
                if response.status_code == 200 and "image" in response.headers.get("content-type", ""):
                    st.image(response.content, caption="Generated Image", use_container_width=True)
                    st.download_button("Download Image", data=response.content, file_name="generated_image.png", mime="image/png")
                else:
                    show_api_error(response, "Image generation failed")
            except Exception as error:
                show_request_exception(error, "Image generation failed")


def show_video_generation():
    st.title("Video Generation")
    st.caption("Saved video generations will appear in My History.")

    with st.form("video_form"):
        prompt = st.text_area("Video Prompt", placeholder="A panda eating bamboo in a lush forest, cinematic, 4k...", height=100)
        negative_prompt = st.text_input("Negative Prompt (optional)", placeholder="blurry, low quality, static")
        col1, col2, col3 = st.columns(3)
        with col1:
            num_frames = st.select_slider("Frames", options=[8, 12, 16, 20, 24], value=16)
            fps = st.select_slider("Playback FPS", options=[4, 6, 8, 10, 12], value=8)
        with col2:
            width = st.selectbox("Width (px)", [256, 320, 512], index=2)
            height = st.selectbox("Height (px)", [256, 320, 512], index=1)
        with col3:
            num_inference_steps = st.slider("Inference Steps", min_value=10, max_value=50, value=25, step=5)
            guidance_scale = st.slider("Guidance Scale", min_value=1.0, max_value=15.0, value=7.5, step=0.5)

        submitted = st.form_submit_button("Generate Video", use_container_width=True)

    if submitted:
        if not prompt.strip():
            st.warning("Please enter a prompt before generating.")
            return

        payload = {
            "prompt": prompt.strip(),
            "negative_prompt": negative_prompt.strip() or None,
            "num_frames": num_frames,
            "num_inference_steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "width": width,
            "height": height,
            "fps": fps,
        }

        with st.spinner("AI is generating your video..."):
            try:
                response = api_request("POST", "/video/generate-video", json=payload, timeout=420)
                if response.status_code == 200:
                    st.image(response.content, caption="Generated Video", use_container_width=True)
                    st.download_button("Download GIF", data=response.content, file_name="meetrix_ai_video.gif", mime="image/gif")
                else:
                    show_api_error(response, "Video generation failed")
            except Exception as error:
                show_request_exception(error, "Video generation failed")


def ensure_chat_session():
    if st.session_state.chat_session_id:
        return
    response = api_request("POST", "/chat/session", timeout=30)
    response.raise_for_status()
    payload = response.json()
    st.session_state.chat_session_id = payload["session_id"]
    st.session_state.chat_messages = []


def load_chat_history(session_id: str):
    response = api_request("GET", f"/chat/history/{session_id}", timeout=30)
    if response.status_code == 200:
        history = response.json()
        st.session_state.chat_session_id = session_id
        st.session_state.chat_messages = [
            {"role": item["role"], "content": item["content"]}
            for item in history.get("messages", [])
        ]


def show_rag_chat():
    st.title("Chat with PDF & Documents")
    st.caption("Chat history is stored in the backend for the logged-in user.")

    ensure_chat_session()

    history_response = api_request("GET", "/auth/history", timeout=30)
    if history_response.status_code == 200:
        sessions = history_response.json().get("chat_sessions", [])
        options = {item["title"]: item["id"] for item in sessions}
        if options:
            selected_title = st.selectbox("Saved Conversations", options=list(options.keys()))
            if st.button("Load Conversation", key="load_conversation"):
                load_chat_history(options[selected_title])
        if st.button("Start New Conversation", key="new_conversation"):
            st.session_state.chat_session_id = None
            ensure_chat_session()
            st.rerun()

    uploaded_file = st.file_uploader(
        "Upload document (PDF, DOCX, TXT, MD, CSV, JSON, PY, JS, TS)",
        type=["pdf", "docx", "txt", "md", "csv", "json", "py", "js", "ts"],
    )

    if uploaded_file is not None and st.button("Index Document"):
        try:
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
            response = api_request(
                "POST",
                f"/chat/upload?session_id={st.session_state.chat_session_id}",
                files=files,
                timeout=120,
            )
            if response.status_code == 200:
                info = response.json()
                st.success(f"Indexed {info['filename']} in {info['chunks_indexed']} chunks")
            else:
                show_api_error(response, "Document upload failed")
        except Exception as error:
            show_request_exception(error, "Document upload failed")

    for message in st.session_state.chat_messages:
        with st.chat_message(message["role"]):
            st.write(message["content"])

    prompt = st.chat_input("Ask anything about your uploaded files...")
    if prompt:
        st.session_state.chat_messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.write(prompt)
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    response = api_request(
                        "POST",
                        "/chat/message",
                        json={"session_id": st.session_state.chat_session_id, "message": prompt},
                        timeout=180,
                    )
                    if response.status_code == 200:
                        result = response.json()
                        answer = result.get("answer", "No answer returned")
                        st.write(answer)
                        st.session_state.chat_messages.append({"role": "assistant", "content": answer})
                    else:
                        show_api_error(response, "Chat failed")
                except Exception as error:
                    show_request_exception(error, "Chat failed")


def show_history():
    st.title("My History")
    try:
        response = api_request("GET", "/auth/history", timeout=30)
        if response.status_code != 200:
            show_api_error(response, "History load failed")
            return
        history = response.json()
    except Exception as error:
        show_request_exception(error, "History load failed")
        return

    st.subheader("Projects")
    projects = history.get("projects", [])
    if not projects:
        st.info("No projects generated yet.")
    for project in projects:
        st.write(f"{project['project_name']}  |  {project['created_at']}")
        download_response = api_request("GET", f"/download/{project['project_slug']}", timeout=120)
        if download_response.status_code == 200:
            st.download_button(
                label=f"Download {project['project_name']}",
                data=download_response.content,
                file_name=f"{project['project_name']}.zip",
                mime="application/zip",
                key=f"project_{project['id']}",
            )

    st.subheader("Images & Videos")
    assets = history.get("assets", [])
    if not assets:
        st.info("No media generated yet.")
    for asset in assets:
        st.write(f"{asset['asset_type'].title()}  |  {asset['created_at']}")
        file_path = Path(asset["file_path"])
        if file_path.exists():
            if asset["asset_type"] == "image":
                st.image(str(file_path), caption=asset["prompt"], width=280)
            else:
                st.image(str(file_path), caption=asset["prompt"], width=280)
        download_response = api_request("GET", f"/auth/assets/{asset['id']}/download", timeout=120)
        if download_response.status_code == 200:
            st.download_button(
                label=f"Download {asset['asset_type']}",
                data=download_response.content,
                file_name=file_path.name,
                mime=asset["mime_type"],
                key=f"asset_{asset['id']}",
            )

    st.subheader("Conversations")
    sessions = history.get("chat_sessions", [])
    if not sessions:
        st.info("No conversations yet.")
    for session in sessions:
        st.write(f"{session['title']}  |  messages: {session['message_count']}")
        if st.button("Open Conversation", key=f"session_{session['id']}"):
            load_chat_history(session["id"])
            go_to("rag_chat")


def show_admin():
    st.title("Admin Panel")
    overview_response = api_request("GET", "/admin/overview", timeout=30)
    users_response = api_request("GET", "/admin/users", timeout=30)
    if overview_response.status_code != 200 or users_response.status_code != 200:
        if overview_response.status_code != 200:
            show_api_error(overview_response, "Admin load failed")
        else:
            show_api_error(users_response, "Admin load failed")
        return

    overview = overview_response.json()
    users = users_response.json().get("users", [])

    col1, col2, col3 = st.columns(3)
    col1.metric("Users", overview["total_users"])
    col2.metric("Projects", overview["projects_generated"])
    col3.metric("Assets", overview["assets_generated"])

    st.subheader("Users")
    st.dataframe(users, use_container_width=True)


init_state()

if not st.session_state.get("auth_token"):
    st.session_state.current_page = "auth"

if st.session_state.current_page == "auth":
    show_auth_page()
else:
    if require_auth():
        render_sidebar()
        page = st.session_state.current_page
        if page == "home":
            show_home()
        elif page == "web_builder":
            show_web_builder()
        elif page == "image_generation":
            show_image_generation()
        elif page == "video_generation":
            show_video_generation()
        elif page == "rag_chat":
            show_rag_chat()
        elif page == "history":
            show_history()
        elif page == "admin":
            show_admin()
        else:
            show_home()
