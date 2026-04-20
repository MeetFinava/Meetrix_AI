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
        ("🎬 Video Generation", "Generate AI videos.", "video_generation"),
        ("📐 Math Solver", "Solve equations step-by-step.", "math_solver"),
        ("📄 Chat with PDF (RAG)", "Ask questions from documents.", "rag_chat"),
        ("✨ Prompt Generator", "Generate powerful prompts.", "prompt_generator"),
        ("💡 Project Suggestion AI", "Get smart project ideas.", "project_ai"),
        ("📚 Research / Thesis Bot", "Academic research assistant.", "research_bot")
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

            # ✅ REQUIRED FIELDS (FIXED)
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
            "admin_panel": admin_panel
        }

        st.subheader("📁 Building Project Live...")

        response = requests.post(
            f"{BACKEND_URL}/build-project",
            json=payload,
            stream=True
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


def show_image_generation():

    if st.button("⬅ Back to Home"):
        go_to("home")

    st.title("🎨 Image Generation")

    with st.form("image_form"):
        prompt = st.text_area(
            "Enter Prompt",
            placeholder="A futuristic hospital UI design, modern, clean..."
        )

        col1, col2 = st.columns(2)
        with col1:
            width = st.selectbox("Width", [256, 512, 768], index=1)
        with col2:
            height = st.selectbox("Height", [256, 512, 768], index=1)

        negative_prompt = st.text_input(
            "Negative Prompt (optional)",
            placeholder="blurry, low quality"
        )

        submitted = st.form_submit_button("Generate Image")

    # =============================
    # GENERATE IMAGE
    # =============================
    if submitted:

        if not prompt.strip():
            st.warning("⚠️ Please enter a prompt")
            return

        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height
        }

        st.subheader("🧠 Generating Image...")

        with st.spinner("AI is creating your image..."):

            try:
                response = requests.post(
                    f"{BACKEND_URL}/image/generate-image",
                    json=payload
                )

                # =============================
                # SUCCESS RESPONSE
                # =============================
                if response.status_code == 200:

                    content_type = response.headers.get("content-type", "")

                    # ✅ Check if it's actually an image
                    if "image" in content_type:

                        st.image(
                            response.content,
                            caption="Generated Image",
                            use_container_width=True
                        )

                        st.success("✅ Image Generated Successfully!")

                        st.download_button(
                            label="⬇️ Download Image",
                            data=response.content,
                            file_name="generated_image.png",
                            mime="image/png"
                        )

                    else:
                        # ❌ Not an image (probably error JSON)
                        st.error("❌ Invalid response from server")
                        st.text(response.text)

                # =============================
                # ERROR RESPONSE
                # =============================
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
# SIMPLE FEATURE PAGES
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
    simple_page("🎬 Video Generation", "Feature under development.")

elif page == "math_solver":
    simple_page("📐 Math Solver", "Feature under development.")

elif page == "rag_chat":
    simple_page("📄 Chat with PDF (RAG)", "Feature under development.")

elif page == "prompt_generator":
    simple_page("✨ Prompt Generator", "Feature under development.")

elif page == "project_ai":
    simple_page("💡 Project Suggestion AI", "Feature under development.")

elif page == "research_bot":
    simple_page("📚 Research / Thesis Bot", "Feature under development.")