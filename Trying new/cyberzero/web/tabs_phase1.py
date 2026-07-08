import streamlit as st
import pandas as pd
from engine.curriculum import CURRICULUM
from engine.progress import complete_module, increment_combo, reset_combo
from engine import simulators
from web import cybot_web

def render_module_card(mod_id: int):
    mod = CURRICULUM.get(mod_id)
    if not mod: return
    
    st.markdown(f"""
    <div style="background: rgba(20, 30, 48, 0.7); border: 1px solid #00ffcc; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0, 255, 204, 0.15);">
        <h2 style="color: #00ffcc; margin-top: 0;">📖 Module {mod_id}: {mod['title']}</h2>
        <div style="background: rgba(0, 255, 204, 0.1); border-left: 4px solid #00ffcc; padding: 10px 15px; border-radius: 4px; font-style: italic; color: #00ffcc; margin-bottom: 15px;">
            <b>💡 Everyday Analogy:</b> {mod['analogy']}
        </div>
        <div style="color: #ffffff; line-height: 1.6; font-size: 1.05em;">
            {mod['lesson'].replace(chr(10), '<br><br>')}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    cybot_web.render_cybot_helper(mod_id)
    
    # Render Quiz
    with st.expander(f"❓ Take Quiz for Module {mod_id} (+XP & Badges)", expanded=False):
        q_data = mod["quiz"]
        st.markdown(f"**Question:** {q_data['question']}")
        choice = st.radio("Choose the best answer:", q_data["options"], key=f"quiz_radio_{mod_id}")
        if st.button("Submit Answer", key=f"quiz_submit_{mod_id}", type="primary"):
            chosen_idx = q_data["options"].index(choice)
            if chosen_idx == q_data["correct_idx"]:
                increment_combo()
                st.success(f"✅ **Correct!** {q_data['explanation']}")
                res = complete_module(mod_id)
                st.balloons()
                if res["xp_result"].get("xp_gained", 0) > 0:
                    st.toast(f"+{res['xp_result']['xp_gained']} XP Earned! 🎉", icon="⚡")
            else:
                reset_combo()
                st.error(f"❌ **Incorrect!** {q_data['explanation']}")
                cybot_web.render_cybot_error(f"Quiz Module {mod_id} incorrect")

def render_phase_1():
    st.markdown("## 🌐 Phase 1: Foundation & The Digital World")
    st.write("Understand the basic building blocks of the internet: servers, IP coordinates, DNS phonebooks, and why plain HTTP is vulnerable to wiretaps!")
    
    tab1, tab2, tab3, tab4 = st.tabs([
        "Mod 1: Networks & Wiretaps", 
        "Mod 2: IP & DNS Phonebook", 
        "Mod 3: HTTP vs HTTPS Lock", 
        "Mod 4: White Hats vs Black Hats"
    ])
    
    with tab1:
        render_module_card(1)
        st.markdown("### 🔬 Interactive Lab: Network Wire Tap Simulator")
        st.write("Click below to intercept real-time network packets traveling across public Wi-Fi airwaves. Watch what happens to plain text vs encrypted data!")
        if st.button("📡 Intercept Live Network Stream", key="lab1_btn", type="primary"):
            packets = simulators.simulate_wire_tap(6)
            df = pd.DataFrame(packets)
            # Style dataframe
            st.dataframe(
                df[["id", "timestamp", "source_ip", "dest_host", "protocol", "status", "payload"]],
                use_container_width=True,
                hide_index=True
            )
            st.success("✅ Notice: HTTP packets display usernames and passwords in plain text! HTTPS wraps data in unreadable SSL/TLS hex armor.")
            complete_module(1)
            
    with tab2:
        render_module_card(2)
        st.markdown("### 🔬 Interactive Lab: DNS Phonebook Lookup")
        st.write("Type a domain name to watch the DNS resolver translate human words into numerical GPS coordinates!")
        domain_input = st.text_input("Enter domain name:", value="google.com", key="lab2_input")
        if st.button("🔍 Resolve DNS Coordinate", key="lab2_btn", type="primary"):
            res = simulators.lookup_dns(domain_input)
            st.info(f"**Resolved IP Coordinate:** `{res['resolved_ip']}`\n\n**Status:** {res['status']}")
            complete_module(2)
            
    with tab3:
        render_module_card(3)
        st.markdown("### 🔬 Interactive Lab: SSL/TLS Encryption Shield Toggle")
        st.write("Test sending a secret credit card number across the web with and without HTTPS!")
        cc_num = st.text_input("Test Secret Data to Send:", value="4532-8810-9921-0012", key="lab3_cc")
        is_secure = st.toggle("🔒 Enable HTTPS Encryption Shield", value=True, key="lab3_toggle")
        if st.button("🚀 Transmit Packet", key="lab3_btn", type="primary"):
            if is_secure:
                enc = simulators.calculate_sha256(cc_num)["sha256"][:32]
                st.success(f"🔒 **PACKET SECURED (HTTPS):** Eavesdroppers only see gibberish armor: `{enc}...`")
                complete_module(3)
            else:
                st.error(f"🔓 **VULNERABLE TRANSMISSION (HTTP):** Eavesdroppers intercepted plain text: `{cc_num}`! Never do this!")
                
    with tab4:
        render_module_card(4)
        st.markdown("### 🔬 Interactive Lab: Hacker Hat Classifier")
        st.write("Classify the following cyber scenario:")
        st.info("**Scenario:** A programmer discovers a security vulnerability in a hospital database. Instead of stealing data, they report it directly to the hospital IT director so it can be fixed.")
        hat_choice = st.radio("What hat color is this programmer wearing?", ["Black Hat", "White Hat (Ethical Hacker)", "Grey Hat"], key="lab4_radio")
        if st.button("Verify Hat Color", key="lab4_btn", type="primary"):
            if "White Hat" in hat_choice:
                st.success("✅ **Correct!** White Hat hackers legally test and report weaknesses to protect organizations!")
                complete_module(4)
            else:
                st.error("❌ Incorrect! Look again at intent: reporting flaws to help fix them is ethical White Hat hacking.")
