import streamlit as st
import requests

BACKEND_URL = "http://localhost:8000/api"

st.set_page_config(page_title="Meetrix AI", layout="wide")

# -----------------------------
# Modern Card CSS
# -----------------------------
st.markdown("""
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
""", unsafe_allow_html=True)

# -----------------------------
# Router State
# -----------------------------
if "current_page" not in st.session_state:
    st.session_state.current_page = "home"

def go_to(page):
    st.session_state.current_page = page
    st.rerun()

# =============================
# HOME PAGE
# =============================
def show_home():

    st.title("🚀 Meetrix AI Platform")
    st.write("Multi-Feature AI Suite")

    col1, col2, col3 = st.columns(3)

    features = [
        ("🛠 Web Builder", "Generate full-stack apps instantly.", "web_builder"),
        ("🎨 Image Generation", "AI image creation engine.", "image_generation"),
        ("🎬 Video Generation", "Generate AI videos from text.", "video_generation"),
        ("📐 Math Solver", "Solve equations step-by-step.", "math_solver"),
        ("📄 Chat with PDF (RAG)", "Ask questions from documents.", "rag_chat"),
        ("✨ Prompt Generator", "Generate powerful prompts.", "prompt_generator"),
        ("💡 Project Suggestion AI", "Get smart project ideas.", "project_ai"),
        ("📚 Research / Thesis Bot", "Academic research assistant.", "research_bot"),
    ]

    columns = [col1, col2, col3]
    for i, (title, desc, key) in enumerate(features):
        with columns[i % 3]:
            st.markdown(f"""
            <div class="card">
                <div class="card-title">{title}</div>
                <div class="card-desc">{desc}</div>
            </div>
            """, unsafe_allow_html=True)

            if st.button("Open", key=key):
                go_to(key)


# =============================
# WEB BUILDER PAGE
# =============================
def show_web_builder():

    if st.button("⬅ Back to Home"):
        go_to("home")

    st.title("🛠 Web Builder")

    with st.form("web_builder_form"):

        col1, col2 = st.columns(2)

        with col1:
            project_name = st.text_input("Project Name")
            website_type = st.selectbox(
                "Website Type",
                ["Hospital", "E-commerce", "Portfolio", "Gym", "School", "SaaS"]
            )
            styling_framework = st.selectbox(
                "Styling Framework",
                ["CSS", "Bootstrap", "Tailwind"]
            )
            theme = st.selectbox(
                "Theme",
                ["Modern", "Minimal", "Dark", "Corporate"]
            )
            frontend_framework = st.selectbox(
                "Frontend Framework",
                ["HTML", "React", "Next.js"]
            )

        with col2:
            backend_required = st.radio("Backend Required?", ["Yes", "No"])
            backend_framework = None
            database = None

            if backend_required == "Yes":
                backend_framework = st.selectbox(
                    "Backend Framework",
                    ["FastAPI", "Node.js", "Django"]
                )
                database = st.selectbox(
                    "Database",
                    ["SQLite", "PostgreSQL", "MongoDB"]
                )

            pages = st.multiselect(
                "Select Pages",
                ["Home", "About", "Contact", "Services", "Blog", "Login", "Dashboard"]
            )

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

        st.subheader("📁 Building Project Live...")

        response = requests.post(
            f"{BACKEND_URL}/build-project",
            json=payload,
            stream=True,
        )

        output_area = st.empty()
        log_text = ""
        build_success = False
        zip_path = None

        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                decoded = chunk.decode("utf-8")
                log_text += decoded

                if "DOWNLOAD_READY::" in log_text:
                    parts = log_text.split("DOWNLOAD_READY::")
                    zip_path = parts[1].strip()
                    log_text = parts[0]

                if "BUILD SUCCESS" in log_text:
                    build_success = True

                output_area.text(log_text)

        if build_success:
            st.success("✅ Project Build Completed Successfully!")
            if zip_path:
                project_name = payload["project_name"]
                download_url = f"{BACKEND_URL}/download/{project_name}"
                st.markdown(f"[⬇️ Download Project ZIP]({download_url})")
        else:
            st.error("❌ Project Build Failed.")


# =============================
# IMAGE GENERATION PAGE
# =============================
def show_image_generation():

    if st.button("⬅ Back to Home"):
        go_to("home")

    st.title("🎨 Image Generation")

    with st.form("image_form"):
        prompt = st.text_area(
            "Enter Prompt",
            placeholder="A futuristic hospital UI design, modern, clean...",
        )

        col1, col2 = st.columns(2)
        with col1:
            width = st.selectbox("Width", [256, 512, 768], index=1)
        with col2:
            height = st.selectbox("Height", [256, 512, 768], index=1)

        negative_prompt = st.text_input(
            "Negative Prompt (optional)",
            placeholder="blurry, low quality",
        )

        submitted = st.form_submit_button("Generate Image")

    if submitted:

        if not prompt.strip():
            st.warning("⚠️ Please enter a prompt")
            return

        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
        }

        st.subheader("🧠 Generating Image...")

        with st.spinner("AI is creating your image..."):
            try:
                response = requests.post(
                    f"{BACKEND_URL}/image/generate-image",
                    json=payload,
                )

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")

                    if "image" in content_type:
                        st.image(
                            response.content,
                            caption="Generated Image",
                            use_container_width=True,
                        )
                        st.success("✅ Image Generated Successfully!")
                        st.download_button(
                            label="⬇️ Download Image",
                            data=response.content,
                            file_name="generated_image.png",
                            mime="image/png",
                        )
                    else:
                        st.error("❌ Invalid response from server")
                        st.text(response.text)
                else:
                    error_msg = response.text
                    if "loading" in error_msg.lower():
                        st.warning("⏳ Model is loading... try again in 10 seconds")
                    else:
                        st.error("❌ Failed to generate image")
                        st.text(error_msg)

            except Exception as e:
                st.error(f"🚨 Error: {e}")


# =============================
# VIDEO GENERATION PAGE  ← NEW
# =============================
def show_video_generation():

    if st.button("⬅ Back to Home"):
        go_to("home")

    st.title("🎬 Video Generation")
    st.caption("Powered by ModelScope Text-to-Video 1.7B (Open-Source · Apache 2.0)")

    st.info(
        "⏳ **Video generation takes 1–3 minutes** on first run (model cold start). "
        "Subsequent requests are faster. Keep the tab open and wait — "
        "a loading spinner will show progress."
    )

    # ── Form ─────────────────────────────────────────────────────────────────
    with st.form("video_form"):

        prompt = st.text_area(
            "📝 Video Prompt",
            placeholder=(
                "A panda eating bamboo in a lush forest, cinematic, 4k...\n"
                "Tip: Be descriptive — mention lighting, motion, style."
            ),
            height=100,
        )

        negative_prompt = st.text_input(
            "🚫 Negative Prompt (optional)",
            placeholder="blurry, low quality, static, no motion",
        )

        st.markdown("#### ⚙️ Advanced Settings")
        col1, col2, col3 = st.columns(3)

        with col1:
            num_frames = st.select_slider(
                "Frames",
                options=[8, 12, 16, 20, 24],
                value=16,
                help="More frames = longer video but slower generation",
            )
            fps = st.select_slider(
                "Playback FPS",
                options=[4, 6, 8, 10, 12],
                value=8,
            )

        with col2:
            width = st.selectbox("Width (px)", [256, 320, 512], index=2)
            height = st.selectbox("Height (px)", [256, 320, 512], index=1)

        with col3:
            num_inference_steps = st.slider(
                "Inference Steps",
                min_value=10,
                max_value=50,
                value=25,
                step=5,
                help="Higher = better quality, slower generation",
            )
            guidance_scale = st.slider(
                "Guidance Scale",
                min_value=1.0,
                max_value=15.0,
                value=7.5,
                step=0.5,
                help="How closely the video follows your prompt",
            )

        submitted = st.form_submit_button("🎬 Generate Video", use_container_width=True)

    # ── Generate ─────────────────────────────────────────────────────────────
    if submitted:

        if not prompt.strip():
            st.warning("⚠️ Please enter a prompt before generating.")
            return

        payload = {
            "prompt":               prompt.strip(),
            "negative_prompt":      negative_prompt.strip() or None,
            "num_frames":           num_frames,
            "num_inference_steps":  num_inference_steps,
            "guidance_scale":       guidance_scale,
            "width":                width,
            "height":               height,
            "fps":                  fps,
        }

        est_seconds = int(num_frames * num_inference_steps * 0.4)
        st.markdown(f"🕐 Estimated time: **~{est_seconds}–{est_seconds + 60} seconds**")

        with st.spinner("🧠 AI is generating your video... Please wait (1–3 min)"):
            try:
                response = requests.post(
                    f"{BACKEND_URL}/video/generate-video",
                    json=payload,
                    timeout=360,
                )

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")

                    if "image/gif" in content_type or len(response.content) > 1000:
                        st.success("✅ Video Generated Successfully!")

                        st.image(
                            response.content,
                            caption=f"Generated Video ({num_frames} frames @ {fps} fps)",
                            use_container_width=True,
                        )

                        with st.expander("📝 Prompt used"):
                            st.write(f"**Prompt:** {prompt}")
                            if negative_prompt:
                                st.write(f"**Negative:** {negative_prompt}")
                            st.write(
                                f"**Settings:** {num_frames} frames | "
                                f"{width}×{height}px | "
                                f"{num_inference_steps} steps | "
                                f"CFG {guidance_scale} | "
                                f"{fps} fps"
                            )

                        st.download_button(
                            label="⬇️ Download GIF",
                            data=response.content,
                            file_name="meetrix_ai_video.gif",
                            mime="image/gif",
                            use_container_width=True,
                        )
                    else:
                        st.error("❌ Received an invalid response from server.")
                        st.text(response.text[:500])

                else:
                    error_text = response.text.lower()
                    if "loading" in error_text:
                        st.warning(
                            "⏳ Model is loading (~30–60s cold start). "
                            "Click **Generate Video** again in ~30 seconds."
                        )
                    elif "timeout" in error_text:
                        st.warning(
                            "⏳ Timed out — try reducing **Frames** to 8 and **Steps** to 10."
                        )
                    else:
                        st.error(f"❌ Generation failed (HTTP {response.status_code})")
                        st.code(response.text[:800])

            except requests.exceptions.Timeout:
                st.error(
                    "🚨 Timed out after 6 minutes. "
                    "Reduce Frames to 8 and Steps to 10 for a faster result."
                )
            except requests.exceptions.ConnectionError:
                st.error(
                    "🚨 Cannot connect to backend. "
                    "Make sure FastAPI is running at http://localhost:8000"
                )
            except Exception as e:
                st.error(f"🚨 Unexpected error: {e}")

    with st.expander("💡 Tips for better videos"):
        st.markdown("""
        **Good prompts:**
        - `A golden retriever running on a beach at sunset, slow motion`
        - `Time-lapse of clouds moving over mountains, cinematic`
        - `A candle flame flickering in a dark room, macro shot`

        **Performance tips:**
        - Start with **8 frames + 10 steps** for a fast test run (~30s)
        - Increase frames/steps only when happy with motion
        - `512×320` is sweet spot for quality vs speed

        **If generation fails:**
        - Wait 30s and retry (model cold-starting)
        - Reduce frames to 8 for faster run
        - Ensure `HF_API_KEY` has **inference** permission on HuggingFace
        """)

def show_rag_chat():

    if st.button("⬅ Back to Home"):
        go_to("home")

    st.title("📄 Chat with PDF & Documents")
    st.caption("Session memory is preserved while this app is running.")

    if "chat_session_id" not in st.session_state:
        st.session_state.chat_session_id = None
    if "chat_messages" not in st.session_state:
        st.session_state.chat_messages = []

    if st.session_state.chat_session_id is None:
        try:
            response = requests.post(f"{BACKEND_URL}/chat/session", timeout=30)
            response.raise_for_status()
            st.session_state.chat_session_id = response.json()["session_id"]
        except Exception as error:
            st.error(f"Unable to initialize chat session: {error}")
            return

    st.success(f"Session: {st.session_state.chat_session_id[:8]}...")

    uploaded_file = st.file_uploader(
        "Upload document (PDF, DOCX, TXT, MD, CSV, JSON, PY, JS, TS)",
        type=["pdf", "docx", "txt", "md", "csv", "json", "py", "js", "ts"],
    )

    if uploaded_file is not None and st.button("Index Document"):
        try:
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
            response = requests.post(
                f"{BACKEND_URL}/chat/upload",
                params={"session_id": st.session_state.chat_session_id},
                files=files,
                timeout=90,
            )
            if response.status_code == 200:
                info = response.json()
                st.success(
                    f"Indexed {info['filename']} in {info['chunks_indexed']} chunks"
                )
            else:
                st.error(response.text)
        except Exception as error:
            st.error(f"Upload failed: {error}")

    st.markdown("---")

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
                    response = requests.post(
                        f"{BACKEND_URL}/chat/message",
                        json={
                            "session_id": st.session_state.chat_session_id,
                            "message": prompt,
                        },
                        timeout=120,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        answer = result.get("answer", "No answer returned")
                        st.write(answer)
                        st.caption(
                            f"Retrieved chunks: {result.get('retrieved_chunks', 0)} | "
                            f"Docs: {', '.join(result.get('documents', [])) or 'None'}"
                        )
                        st.session_state.chat_messages.append(
                            {"role": "assistant", "content": answer}
                        )
                    else:
                        st.error(response.text)
                except Exception as error:
                    st.error(f"Chat error: {error}")




# =============================
# SIMPLE PLACEHOLDER PAGES
# =============================
def simple_page(title, message):
    if st.button("⬅ Back to Home"):
        go_to("home")
    st.title(title)
    st.info(message)


# =============================
# ROUTER
# =============================
page = st.session_state.current_page

if page == "home":
    show_home()

elif page == "web_builder":
    show_web_builder()

elif page == "image_generation":
    show_image_generation()

elif page == "video_generation":
    show_video_generation()           # ← NOW LIVE (was simple_page placeholder)

elif page == "math_solver":
    simple_page("📐 Math Solver", "Feature under development.")

elif page == "rag_chat":
    show_rag_chat()

elif page == "prompt_generator":
    simple_page("✨ Prompt Generator", "Feature under development.")

elif page == "project_ai":
    simple_page("💡 Project Suggestion AI", "Feature under development.")

elif page == "research_bot":
    simple_page("📚 Research / Thesis Bot", "Feature under development.")
