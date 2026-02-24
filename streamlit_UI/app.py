import streamlit as st
import requests
import os

BACKEND_URL = "http://localhost:8000/api"

st.set_page_config(page_title="Meetrix AI Web Builder", layout="wide")

st.title("🚀 Meetrix AI - Web Builder")

# -----------------------------
# Step 1: Field Selection Form
# -----------------------------

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

    generate_prompt_btn = st.form_submit_button("Generate Prompt")


# -----------------------------
# Step 2: Generate Prompt
# -----------------------------

if generate_prompt_btn:

    st.session_state.payload = {
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

    with st.spinner("🧠 Generating Prompt..."):
        response = requests.post(
            f"{BACKEND_URL}/generate-prompt",
            json=st.session_state.payload
        )

    if response.status_code == 200:
        st.session_state.generated_prompt = response.json()["generated_prompt"]
    else:
        st.error("❌ Prompt generation failed.")


# -----------------------------
# Step 3: Editable Prompt + Build
# -----------------------------

if "generated_prompt" in st.session_state:

    st.subheader("🧠 Generated Prompt (Edit if needed)")

    edited_prompt = st.text_area(
        "Prompt",
        value=st.session_state.generated_prompt,
        height=300
    )

    if st.button("🚀 Generate Website"):

        if "payload" not in st.session_state:
            st.error("⚠️ Please generate prompt first.")
            st.stop()

        st.subheader("📁 Building Project Live...")

        response = requests.post(
            f"{BACKEND_URL}/build-project",
            json=st.session_state.payload,
            stream=True
        )

        output_area = st.empty()
        log_text = ""
        zip_file_path = None

        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                decoded = chunk.decode("utf-8")
                log_text += decoded

                # Detect ZIP signal
                if "DOWNLOAD_READY::" in log_text:
                    parts = log_text.split("DOWNLOAD_READY::")
                    zip_file_path = parts[1].strip()
                    log_text = parts[0]  # Remove signal from display

                output_area.text(log_text)

        st.success("✅ Project Build Completed Successfully!")

        # -----------------------------
        # Show Download Button
        # -----------------------------
        if zip_file_path:
            project_name = st.session_state.payload["project_name"]

            download_url = f"{BACKEND_URL}/download/{project_name}"

            st.markdown(
                f"[⬇️ Download Project ZIP]({download_url})",
                unsafe_allow_html=True
            )
        else:
            st.warning("⚠️ ZIP file not found.")