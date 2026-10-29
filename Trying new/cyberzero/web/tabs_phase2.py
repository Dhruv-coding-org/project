import streamlit as st
import time
from engine.curriculum import CURRICULUM
from engine.progress import complete_module, record_boss_victory, increment_combo, reset_combo
from engine import simulators
from engine.boss_engine import get_boss_info, evaluate_boss_1_defense
from web import cybot_web
from web.tabs_phase1 import render_module_card

def render_phase_2():
    st.markdown("## 🛡️ Phase 2: Personal Protection & Identity Armor")
    st.write("Learn how to fortify your digital identity against credential stuffing, phishing hooks, and social engineering con artists!")
    
    tab5, tab6, tab7, tab8, tab_boss1 = st.tabs([
        "Mod 5: Password Fortress", 
        "Mod 6: MFA 2FA Shield", 
        "Mod 7: Phishing Detective", 
        "Mod 8: Social Engineering",
        "⚡ BOSS BATTLE 1"
    ])
    
    with tab5:
        render_module_card(5)
        st.markdown("### 🔬 Interactive Lab: Real-Time Password Cracking Speed Calculator")
        st.write("Type a password to test its mathematical combination entropy against automated GPU hacker clusters!")
        pwd_input = st.text_input("Enter test password:", value="P@ssw0rd!2026_Titanium", key="lab5_pwd", type="default")
        
        res = simulators.calculate_password_entropy(pwd_input)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Mathematical Combinations", res["combinations"])
        with col2:
            st.metric("Estimated Time to Crack", res["time_to_crack"])
        with col3:
            st.metric("Strength Rating", res["strength"])
            
        st.progress(res["score"] / 100.0, text=f"Security Score: {res['score']} / 100")
        
        for tip in res["tips"]:
            st.info(f"💡 {tip}")
            
        if res["score"] >= 75:
            st.success("🌟 Excellent! Your password has titanium entropy!")
            complete_module(5)
            
    with tab6:
        render_module_card(6)
        st.markdown("### 🔬 Interactive Lab: Live MFA Authenticator Token Generator")
        st.write("Watch how an Authenticator app generates a rotating 6-digit passcode every 30 seconds!")
        totp = simulators.generate_totp()
        st.markdown(f"""
        <div style="background: rgba(0, 255, 102, 0.1); border: 2px solid #00ff66; border-radius: 10px; padding: 20px; text-align: center; max-width: 400px; margin: 10px auto;">
            <div style="font-size: 0.9em; color: #aaa;">ACTIVE 2FA PASSCODE TOKEN</div>
            <div style="font-size: 3em; font-weight: bold; color: #00ff66; letter-spacing: 5px; font-family: monospace;">{totp['token']}</div>
            <div style="font-size: 0.8em; color: #ddd;">Expires in {totp['expires_in']} seconds...</div>
        </div>
        """, unsafe_allow_html=True)
        
        code_input = st.text_input("Enter 6-digit passcode to simulate MFA verification:", value=totp['token'], key="lab6_code")
        if st.button("Verify MFA Token", key="lab6_btn", type="primary"):
            if code_input.strip() == totp['token']:
                st.success("✅ **Login Verified!** Even if a hacker stole your password, they cannot enter without this physical rotating token!")
                complete_module(6)
            else:
                st.error("❌ Invalid token! Access Denied.")
                
    with tab7:
        render_module_card(7)
        st.markdown("### 🔬 Interactive Lab: Phishing Detective Inbox")
        st.write("Inspect the suspicious emails below. Identify which are legitimate and which are phishing con artist traps!")
        emails = simulators.get_phishing_emails()
        
        for e in emails[:3]:
            with st.expander(f"📧 Email #{e['id']}: From `{e['sender']}` - Subject: {e['subject']}", expanded=True):
                st.markdown(f"**From:** `{e['sender']}`\n\n**Subject:** `{e['subject']}`\n\n**Body:** *{e['body']}*\n\n**Link Destination URL:** `{e['link_url']}`\n\n**Attachment:** `{e['attachment']}`")
                
                col_a, col_b = st.columns(2)
                with col_a:
                    if st.button("🚨 Report as PHISHING SCAM", key=f"phish_btn_{e['id']}", type="primary"):
                        if e["is_phishing"]:
                            st.success(f"✅ **Spot on Detective!** {e['reason']}")
                            complete_module(7)
                        else:
                            st.error(f"❌ False alarm! {e['reason']}")
                with col_b:
                    if st.button("✅ Mark as SAFE / LEGITIMATE", key=f"safe_btn_{e['id']}", type="secondary"):
                        if not e["is_phishing"]:
                            st.success(f"✅ **Spot on Detective!** {e['reason']}")
                            complete_module(7)
                        else:
                            st.error(f"❌ Oh no! You just clicked a phishing hook! {e['reason']}")
                            
    with tab8:
        render_module_card(8)
        st.markdown("### 🔬 Interactive Lab: Vishing & SMS Scam Analyzer")
        st.write("Analyze the following SMS text message:")
        st.warning("📱 **SMS from 'USPS-Alert':** Your package #US99120 is held at warehouse due to unpaid address fee of $1.99. Pay immediately at `http://usps-redelivery-fee.com` or package will be destroyed.")
        sms_choice = st.radio("What type of social engineering attack is this?", ["Smishing (SMS Phishing)", "Vishing (Voice Phishing)", "Legitimate Postal Service Notice"], key="lab8_radio")
        if st.button("Analyze SMS", key="lab8_btn", type="primary"):
            if "Smishing" in sms_choice:
                st.success("✅ **Correct!** Postal services never send unencrypted HTTP links demanding instant credit card fees via SMS text!")
                complete_module(8)
            else:
                st.error("❌ Incorrect! Beware of urgency and fake delivery domain spelling.")
                
    with tab_boss1:
        boss = get_boss_info(1)
        st.markdown(f"## 💥 {boss['name']}")
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #3a1c1c, #1a0a0a); border: 2px solid #ff3333; border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 0 20px rgba(255, 51, 51, 0.4);">
            <h2 style="color: #ff3333; margin: 0;">🦹 VILLAIN: {boss['villain']}</h2>
            <p style="color: #ffffff; font-size: 1.1em; margin-top: 15px;">{boss['desc']}</p>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px; color: #ffcc00; font-weight: bold; margin-top: 15px;">
                ⚡ INSTRUCTIONS: {boss['instructions']}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.write("")
        st.markdown("### 🚀 COMMAND CENTER DEFENSE CONTROL")
        defense_pwd = st.text_input("Step 1: Enter Reinforced Titanium Vault Password (length >= 12, symbols, digits):", value="P@ssw0rd!2026_Titanium_Shield!", key="boss1_pwd")
        mfa_shield = st.toggle("🛡️ Step 2: Activate 2FA Authenticator Shield", value=True, key="boss1_mfa")
        
        if st.button("⚡ EXECUTE VAULT DEFENSE PROTOCOL", key="boss1_exec", type="primary", use_container_width=True):
            res = evaluate_boss_1_defense(defense_pwd, mfa_shield)
            if res["won"]:
                st.balloons()
                st.success(f"🏆 **BOSS VICTORY!** {res['message']}")
                record_boss_victory(1)
            else:
                st.error(f"❌ **DEFENSE FAILED!** {res['message']}")
                cybot_web.render_cybot_error("Boss Battle 1 Failed - Strengthen password or toggle 2FA")
