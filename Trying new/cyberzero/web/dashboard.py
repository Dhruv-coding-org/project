import streamlit as st
import time
from engine.progress import UserProfile, RANKS, BADGE_DEFINITIONS, save_profile, reset_progress

def render_sidebar(profile: UserProfile):
    with st.sidebar:
        st.markdown("""
        <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); border-radius: 12px; border: 1px solid #00ffcc; box-shadow: 0 0 15px rgba(0, 255, 204, 0.3);">
            <h2 style="color: #00ffcc; margin: 0; font-family: 'Courier New', monospace;">🛡️ CYBERZERO</h2>
            <p style="color: #ffffff; font-size: 0.85em; margin: 5px 0 0 0;">INTELLIGENCE COMMAND CENTER</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.write("")
        
        # Operative Profile Card
        st.markdown(f"**🕵️ Operative:** `{profile.user_name}`")
        st.markdown(f"**🎖️ Rank:** Level {profile.level} - **{profile.rank_title}**")
        
        # XP Progress
        next_xp = RANKS[-1][0]
        for thresh, title in RANKS:
            if thresh > profile.xp:
                next_xp = thresh
                break
        pct = min(1.0, float(profile.xp) / float(max(1, next_xp)))
        st.progress(pct, text=f"⚡ XP: {profile.xp} / {next_xp} ({int(pct*100)}%)")
        
        # Combo & Stats Metrics
        col1, col2 = st.columns(2)
        with col1:
            st.metric(label="🔥 Combo Streak", value=f"{profile.combo_streak}x")
        with col2:
            st.metric(label="📚 Modules", value=f"{len(profile.completed_modules)}/22")
            
        col3, col4 = st.columns(2)
        with col3:
            st.metric(label="🏆 Badges", value=f"{len(profile.unlocked_badges)}/22")
        with col4:
            st.metric(label="⚡ Bosses", value=f"{len(profile.boss_victories)}/4")
            
        st.divider()
        
        # Theme Selector
        st.subheader("🎨 Visual Theme")
        themes = ["Cyberpunk Neon", "Matrix Green", "Solarized Dark", "High Contrast Gold"]
        current_idx = themes.index(profile.theme) if profile.theme in themes else 0
        new_theme = st.selectbox("Select Interface Theme", themes, index=current_idx)
        if new_theme != profile.theme:
            profile.theme = new_theme
            save_profile(profile)
            st.rerun()
            
        st.divider()
        
        # Reset Button
        if st.button("⚠️ Reset All Progress", type="secondary", use_container_width=True):
            reset_progress()
            st.success("Progress reset to Level 1!")
            time.sleep(1)
            st.rerun()
            
        st.markdown("<div style='text-align:center; font-size: 0.75em; color: #888;'>Powered by Gemini 3.1 Pro Engine</div>", unsafe_allow_html=True)

def render_trophy_room(profile: UserProfile):
    st.markdown("### 🏆 Operative Trophy Room & Badges")
    st.write("Complete modules and conquer labs to earn glowing achievement badges!")
    
    cols = st.columns(4)
    for badge_id in range(1, 23):
        b = BADGE_DEFINITIONS.get(badge_id)
        if not b: continue
        unlocked = badge_id in profile.unlocked_badges
        col = cols[(badge_id - 1) % 4]
        
        with col:
            if unlocked:
                st.markdown(f"""
                <div style="background: rgba(0, 255, 204, 0.1); border: 2px solid #00ffcc; border-radius: 10px; padding: 15px; text-align: center; margin-bottom: 15px; box-shadow: 0 0 10px rgba(0, 255, 204, 0.4);">
                    <div style="font-size: 2.5em;">{b['icon']}</div>
                    <div style="font-weight: bold; color: #00ffcc; font-size: 0.9em; margin-top: 5px;">{b['name']}</div>
                    <div style="font-size: 0.75em; color: #ddd; margin-top: 5px;">{b['desc']}</div>
                    <div style="margin-top: 8px; font-size: 0.7em; color: #00ff66; font-weight: bold;">UNLOCKED ✅</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="background: rgba(50, 50, 50, 0.2); border: 1px dashed #666; border-radius: 10px; padding: 15px; text-align: center; margin-bottom: 15px; opacity: 0.6;">
                    <div style="font-size: 2.5em;">🔒</div>
                    <div style="font-weight: bold; color: #aaa; font-size: 0.9em; margin-top: 5px;">Locked Badge #{badge_id}</div>
                    <div style="font-size: 0.75em; color: #777; margin-top: 5px;">Complete Module {badge_id}</div>
                    <div style="margin-top: 8px; font-size: 0.7em; color: #888;">LOCKED 🔒</div>
                </div>
                """, unsafe_allow_html=True)

def render_diploma(profile: UserProfile):
    st.markdown("### 🎓 Official Cyber Guardian Graduation Certificate")
    if len(profile.completed_modules) < 22 and 4 not in profile.boss_victories:
        st.warning("🔒 You must complete all 22 modules or conquer Boss Battle 4 to unlock your printable Graduation Diploma!")
        return
        
    date_str = time.strftime("%B %d, %Y")
    st.markdown(f"""
    <div style="border: 10px double #ffd700; padding: 40px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; text-align: center; box-shadow: 0 0 30px rgba(255, 215, 0, 0.5); font-family: 'Georgia', serif; margin: 20px 0;">
        <div style="font-size: 4em; margin-bottom: 10px;">👑 🛡️ 🎓</div>
        <h1 style="color: #ffd700; font-size: 2.8em; margin: 0; text-transform: uppercase; letter-spacing: 3px;">Certificate of Mastery</h1>
        <h3 style="color: #00ffcc; font-weight: normal; margin-top: 10px;">This officially certifies that</h3>
        <h1 style="color: #ffffff; font-size: 3.2em; text-decoration: underline; text-underline-offset: 10px; margin: 20px 0;">{profile.user_name}</h1>
        <h3 style="color: #ddd; font-weight: normal; max-width: 700px; margin: 0 auto; line-height: 1.6;">
            has successfully completed all 22 interactive training modules, conquered 4 defensive Boss Sieges, and demonstrated proficiency in network security, cryptography, malware triage, and ethical defense.
        </h3>
        <h2 style="color: #00ff66; margin: 30px 0 10px 0; font-size: 2em;">Rank Achieved: GRANDMASTER CYBER GUARDIAN</h2>
        <p style="color: #aaa; font-size: 0.9em; margin-top: 30px;">Issued on {date_str} by the CyberZero Global Defense Academy</p>
        <div style="margin-top: 30px; display: inline-block; border-top: 2px solid #ffd700; padding-top: 5px; width: 250px; color: #ffd700; font-style: italic;">
            Cy-Bot AI Chief Instructor
        </div>
    </div>
    """, unsafe_allow_html=True)
    st.balloons()
