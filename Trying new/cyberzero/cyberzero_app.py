import sys
from pathlib import Path

# Ensure root package folder is in sys.path for IDEs and Streamlit runner
_root = str(Path(__file__).resolve().parent)
if _root not in sys.path:
    sys.path.insert(0, _root)

import streamlit as st
from engine.progress import load_profile
from web import dashboard, cybot_web, tabs_phase1, tabs_phase2, tabs_phase3, tabs_phase4, tabs_phase5

# Must be first Streamlit command
st.set_page_config(
    page_title="CyberZero Command Center",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

def inject_theme_css(theme_name: str):
    if theme_name == "Matrix Green":
        primary = "#00ff66"
        bg = "#050f05"
        card_bg = "rgba(0, 40, 10, 0.6)"
        border = "#00ff66"
    elif theme_name == "Solarized Dark":
        primary = "#2aa198"
        bg = "#002b36"
        card_bg = "rgba(7, 54, 66, 0.8)"
        border = "#268bd2"
    elif theme_name == "High Contrast Gold":
        primary = "#ffd700"
        bg = "#111111"
        card_bg = "rgba(40, 35, 10, 0.8)"
        border = "#ffd700"
    else:  # Cyberpunk Neon (Default)
        primary = "#00ffcc"
        bg = "#0a0a16"
        card_bg = "rgba(20, 20, 40, 0.7)"
        border = "#ff007f"

    css = f"""
    <style>
    /* Main Background */
    .stApp {{
        background-color: {bg};
        background-image: radial-gradient(circle at 50% 10%, rgba(0, 255, 204, 0.08), transparent 70%);
        color: #f0f0f0;
        font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
    }}
    
    /* Headers & Titles */
    h1, h2, h3 {{
        color: {primary} !important;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(0, 255, 204, 0.3);
    }}
    
    /* Cards and Containers */
    div.stButton > button:first-child {{
        background: linear-gradient(90deg, {primary}, #0088ff);
        color: #000000;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        transition: all 0.3s ease;
        box-shadow: 0 0 12px rgba(0, 255, 204, 0.4);
    }}
    
    div.stButton > button:first-child:hover {{
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(0, 255, 204, 0.8);
        color: #ffffff;
    }}
    
    /* Expanders & Tabs */
    .streamlit-expanderHeader {{
        background-color: {card_bg};
        border: 1px solid {border};
        border-radius: 8px;
        color: {primary};
        font-weight: bold;
    }}
    
    /* Metrics */
    [data-testid="stMetricValue"] {{
        color: {primary} !important;
        font-family: 'Courier New', monospace;
        font-weight: bold;
    }}
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)

def main():
    profile = load_profile()
    inject_theme_css(profile.theme)
    
    # Render Sidebar
    dashboard.render_sidebar(profile)
    
    # Main Header Banner
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, rgba(15, 32, 39, 0.9), rgba(32, 58, 67, 0.9), rgba(44, 83, 100, 0.9)); border: 2px solid #00ffcc; border-radius: 15px; padding: 25px; margin-bottom: 25px; box-shadow: 0 0 25px rgba(0, 255, 204, 0.3); text-align: center;">
        <h1 style="font-size: 3em; margin: 0; letter-spacing: 2px;">🛡️ CYBERZERO COMMAND CENTER</h1>
        <p style="color: #ffffff; font-size: 1.2em; margin-top: 10px;">
            Welcome back, Operative <b>{profile.user_name}</b>! Rank: <span style="color: #00ffcc; font-weight: bold;">{profile.rank_title} (Lvl {profile.level})</span>
        </p>
        <div style="display: flex; justify-content: center; gap: 30px; margin-top: 15px; font-size: 1.1em;">
            <div>⚡ <b>XP:</b> {profile.xp}</div>
            <div>🔥 <b>Streak:</b> {profile.combo_streak}x</div>
            <div>📚 <b>Completed:</b> {len(profile.completed_modules)}/22</div>
            <div>🏆 <b>Badges:</b> {len(profile.unlocked_badges)}/22</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Top-level Navigation Tabs
    tab_p1, tab_p2, tab_p3, tab_p4, tab_p5, tab_trophy, tab_ai, tab_diploma = st.tabs([
        "🌐 Phase 1: Foundation", 
        "🛡️ Phase 2: Protection", 
        "☣️ Phase 3: Contagions", 
        "🌐 Phase 4: Network Security", 
        "🔐 Phase 5: Advanced Defense",
        "🏆 Trophy Room",
        "🤖 Cy-Bot AI Mentor",
        "🎓 Graduation Diploma"
    ])
    
    with tab_p1:
        tabs_phase1.render_phase_1()
    with tab_p2:
        tabs_phase2.render_phase_2()
    with tab_p3:
        tabs_phase3.render_phase_3()
    with tab_p4:
        tabs_phase4.render_phase_4()
    with tab_p5:
        tabs_phase5.render_phase_5()
    with tab_trophy:
        dashboard.render_trophy_room(profile)
    with tab_ai:
        cybot_web.render_cybot_chat()
    with tab_diploma:
        dashboard.render_diploma(profile)

if __name__ == "__main__":
    main()
