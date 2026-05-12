import streamlit as st
from llm import get_role_fit, get_skill_gap, get_project_idea, get_resume

# --- Page Config ---
st.set_page_config(
    page_title="CareerForge AI",
    page_icon="🚀",
    layout="centered"
)

# --- Custom CSS ---
st.markdown("""
    <style>
    .main { background-color: #0f0f0f; }
    .stButton>button {
        background-color: #6C63FF;
        color: white;
        border-radius: 10px;
        padding: 10px 24px;
        font-size: 16px;
        border: none;
        width: 100%;
    }
    .stButton>button:hover {
        background-color: #574fd6;
    }
    .result-box {
        background-color: #1e1e2e;
        border-left: 4px solid #6C63FF;
        padding: 20px;
        border-radius: 10px;
        margin-top: 10px;
        color: #e0e0e0;
        white-space: pre-wrap;
    }
    .step-header {
        color: #6C63FF;
        font-size: 22px;
        font-weight: bold;
        margin-top: 30px;
    }
    .tag {
        background-color: #6C63FF22;
        border: 1px solid #6C63FF;
        color: #6C63FF;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        display: inline-block;
        margin: 4px;
    }
    </style>
""", unsafe_allow_html=True)

# --- Header ---
st.markdown("# 🚀 CareerForge AI")
st.markdown("#### Your personal AI placement co-pilot — from confused grad to interview-ready.")
st.markdown("---")

# --- Session State Init ---
if "step" not in st.session_state:
    st.session_state.step = 1
if "role_fit" not in st.session_state:
    st.session_state.role_fit = ""
if "chosen_role" not in st.session_state:
    st.session_state.chosen_role = ""
if "skill_gap" not in st.session_state:
    st.session_state.skill_gap = ""
if "project" not in st.session_state:
    st.session_state.project = ""
if "resume" not in st.session_state:
    st.session_state.resume = ""
if "user_data" not in st.session_state:
    st.session_state.user_data = {}

# ========================
# STEP 1 — About You
# ========================
if st.session_state.step >= 1:
    st.markdown('<div class="step-header">Step 1 — Tell us about yourself</div>', unsafe_allow_html=True)

    with st.form("user_form"):
        name = st.text_input("Your name", placeholder="e.g. Arjun Mehta")
        degree = st.text_input("Your degree", placeholder="e.g. B.Tech Computer Science, 2024")
        skills = st.text_area("Skills you know", placeholder="e.g. Python, Django, basic ML, SQL")
        interests = st.text_area("What genuinely interests you?", placeholder="e.g. I love building tools, I'm obsessed with AI, I enjoy data puzzles")
        tried = st.text_area("What have you tried so far for placement?", placeholder="e.g. Applied to 20 companies, got no replies. Tried Upwork, no clients.")
        submitted = st.form_submit_button("Find my best-fit roles →")

    if submitted:
        if not name or not degree or not skills or not interests:
            st.error("Please fill in all fields.")
        else:
            st.session_state.user_data = {
                "name": name,
                "degree": degree,
                "skills": skills,
                "interests": interests,
                "tried": tried
            }
            with st.spinner("Analyzing your profile... 🔍"):
                st.session_state.role_fit = get_role_fit(name, degree, skills, interests, tried)
            st.session_state.step = 2
            st.rerun()

# ========================
# STEP 2 — Role Fit
# ========================
if st.session_state.step >= 2:
    st.markdown('<div class="step-header">Step 2 — Your Best-Fit Roles</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="result-box">{st.session_state.role_fit}</div>', unsafe_allow_html=True)

    st.markdown("#### Which role do you want to pursue?")
    chosen = st.text_input("Type the role name exactly", placeholder="e.g. Backend Developer")

    if st.button("Analyse my skill gap →"):
        if not chosen:
            st.error("Please enter a role.")
        else:
            st.session_state.chosen_role = chosen
            with st.spinner("Finding your skill gaps... 🧠"):
                st.session_state.skill_gap = get_skill_gap(
                    chosen,
                    st.session_state.user_data["degree"],
                    st.session_state.user_data["skills"]
                )
            st.session_state.step = 3
            st.rerun()

# ========================
# STEP 3 — Skill Gap
# ========================
if st.session_state.step >= 3:
    st.markdown('<div class="step-header">Step 3 — Your Skill Gap & Learning Plan</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="result-box">{st.session_state.skill_gap}</div>', unsafe_allow_html=True)

    if st.button("Generate my killer project idea →"):
        with st.spinner("Cooking up a project that will impress HRs... 💡"):
            st.session_state.project = get_project_idea(
                st.session_state.chosen_role,
                st.session_state.user_data["skills"],
                st.session_state.user_data["interests"]
            )
        st.session_state.step = 4
        st.rerun()

# ========================
# STEP 4 — Project Idea
# ========================
if st.session_state.step >= 4:
    st.markdown('<div class="step-header">Step 4 — Your Killer Project Idea</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="result-box">{st.session_state.project}</div>', unsafe_allow_html=True)

    if st.button("Build my ATS resume →"):
        with st.spinner("Crafting your ATS-optimized resume... 📄"):
            st.session_state.resume = get_resume(
                st.session_state.user_data["name"],
                st.session_state.user_data["degree"],
                st.session_state.user_data["skills"],
                st.session_state.chosen_role,
                st.session_state.project
            )
        st.session_state.step = 5
        st.rerun()

# ========================
# STEP 5 — Resume
# ========================
if st.session_state.step >= 5:
    st.markdown('<div class="step-header">Step 5 — Your ATS Resume</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="result-box">{st.session_state.resume}</div>', unsafe_allow_html=True)

    st.download_button(
        label="⬇️ Download Resume as .txt",
        data=st.session_state.resume,
        file_name="resume.txt",
        mime="text/plain"
    )

    st.markdown("---")
    st.success("🎉 You're interview-ready. Now go build that project and apply everywhere.")

    if st.button("🔄 Start over"):
        for key in st.session_state.keys():
            del st.session_state[key]
        st.rerun()