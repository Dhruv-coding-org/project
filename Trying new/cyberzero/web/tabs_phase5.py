import streamlit as st
import pandas as pd
from engine.curriculum import CURRICULUM
from engine.progress import complete_module, record_boss_victory
from engine import simulators
from engine.boss_engine import get_boss_info, evaluate_boss_4_defense
from web import cybot_web
from web.tabs_phase1 import render_module_card

def render_phase_5():
    st.markdown("## 🔐 Phase 5: Advanced Defense & Cryptographic Citadel")
    st.write("Step into the shoes of a Chief Security Officer! Generate SHA-256 digital fingerprints, mitigate massive DDoS botnet floods, deploy emergency patches, and reconstruct intrusion timelines from system logs.")
    
    tab18, tab19, tab20, tab21, tab22, tab_boss4 = st.tabs([
        "Mod 18: SHA-256 Hashing", 
        "Mod 19: DDoS & Botnets", 
        "Mod 20: Zero-Days & Patches", 
        "Mod 21: Forensics & Logs",
        "Mod 22: Capstone Defense",
        "👑 BOSS BATTLE 4"
    ])
    
    with tab18:
        render_module_card(18)
        st.markdown("### 🔬 Interactive Lab: Live SHA-256 Cryptographic Hasher")
        st.write("Type any text below. Watch how changing even a single period transforms the entire 64-character digital fingerprint!")
        hash_input = st.text_input("Enter text or password to hash:", value="CyberZero_Academy_2026", key="lab18_input")
        if st.button("💍 Compute SHA-256 Fingerprint", key="lab18_btn", type="primary"):
            res = simulators.calculate_sha256(hash_input)
            st.markdown(f"""
            <div style="background: rgba(0, 255, 204, 0.1); border: 1px solid #00ffcc; border-radius: 8px; padding: 15px; font-family: monospace; word-break: break-all;">
                <b>Input Text:</b> {res['input']}<br><br>
                <b style="color: #00ffcc;">SHA-256 Fingerprint (64 hex characters):</b><br>
                <span style="color: #ffff00; font-size: 1.1em;">{res['sha256']}</span>
            </div>
            """, unsafe_allow_html=True)
            st.info("💡 Notice: Even supercomputers cannot take that yellow hex string and reverse it back into your input text!")
            complete_module(18)
            
    with tab19:
        render_module_card(19)
        st.markdown("### 🔬 Interactive Lab: DDoS Traffic Shaper & Rate Limiter")
        st.write("A zombie botnet of 10,000 infected smart TVs is flooding your server with 500,000 fake web requests per second!")
        rate_limit = st.slider("Set Maximum Requests Allowed Per Second per IP Address (Rate Limit):", min_value=10, max_value=1000, value=500, step=10, key="lab19_slider")
        shield_active = st.toggle("🛡️ Activate Cloudflare / Traffic Shaking Shield", value=True, key="lab19_toggle")
        
        if st.button("🚀 Apply Traffic Shaping Defense", key="lab19_btn", type="primary"):
            if rate_limit <= 50 and shield_active:
                st.success(f"✅ **DDoS Flood Mitigated!** By limiting IPs to {rate_limit} req/sec and enabling traffic shaking, you filtered out the botnet spam while letting real paying customers enter!")
                complete_module(19)
            elif not shield_active:
                st.error("❌ **Server Crashed!** Without a traffic shaking shield, your server CPU hit 100% and went offline!")
            else:
                st.warning(f"🟡 Rate limit of {rate_limit} req/sec is still too high! The botnet is slipping through. Lower the limit to <= 50!")
                
    with tab20:
        render_module_card(20)
        st.markdown("### 🔬 Interactive Lab: Zero-Day Vulnerability Patch Deployer")
        st.write("A critical Zero-Day flaw (CVE-2026-9912) was just discovered in your operating system kernel. Hackers are scanning the web for unpatched machines right now!")
        patch_action = st.radio("What is your emergency protocol?", [
            "Wait 3 weeks until scheduled maintenance day", 
            "Hit 'Remind Me Tomorrow' on the alert popup", 
            "Deploy and verify the emergency security patch immediately across all network endpoints"
        ], index=2, key="lab20_radio")
        if st.button("Execute Protocol", key="lab20_btn", type="primary"):
            if "immediately" in patch_action:
                st.success("✅ **Endpoints Secured!** By patching immediately, you sealed the newly discovered crack before criminal exploit scripts could climb through!")
                complete_module(20)
            else:
                st.error("❌ **System Breached!** While you waited, automated scanners found your unpatched kernel and dropped ransomware into your system!")
                
    with tab21:
        render_module_card(21)
        st.markdown("### 🔬 Interactive Lab: Cyber Forensics System Log Analyzer")
        st.write("An intrusion alarm went off at 03:41 AM! Review the system audit log below and identify the root cause of the breach:")
        logs = simulators.get_log_entries()
        st.dataframe(pd.DataFrame(logs), use_container_width=True, hide_index=True)
        
        root_cause = st.selectbox("What was the initial vector of the intrusion at 03:41:12?", [
            "A normal admin login from internal IP 192.168.1.10",
            "A brute-force dictionary attack from IP 185.220.101.5 that succeeded on user 'root'",
            "A routine software audio driver update"
        ], index=1, key="lab21_box")
        
        if st.button("Submit Forensic Findings", key="lab21_btn", type="primary"):
            if "185.220.101.5" in root_cause:
                st.success("✅ **Spot on Forensic Investigator!** By chaining the failed login spike to the file drop and outbound connection, you traced the exact attack timeline and isolated the breached IP!")
                complete_module(21)
            else:
                st.error("❌ Look closer at timestamp 03:41:12: 50 failed login attempts in 10 seconds indicates an automated brute-force attack!")
                
    with tab22:
        render_module_card(22)
        st.markdown("### 🔬 Interactive Lab: Defense in Depth Armor Verification")
        st.write("Verify that all 4 overlapping layers of security armor are active in your command center:")
        c1, c2 = st.columns(2)
        with c1:
            l1 = st.checkbox("Layer 1: Perimeter Defense (Firewalls & VPNs)", value=True, key="lab22_l1")
            l2 = st.checkbox("Layer 2: Identity Armor (Strong Passwords & MFA)", value=True, key="lab22_l2")
        with c2:
            l3 = st.checkbox("Layer 3: Endpoint Protection (Sandboxes & Offline Backups)", value=True, key="lab22_l3")
            l4 = st.checkbox("Layer 4: Application Shielding (SQL Sanitization & Patching)", value=True, key="lab22_l4")
            
        if st.button("Verify Grand Grid Armor", key="lab22_btn", type="primary"):
            if l1 and l2 and l3 and l4:
                st.success("🌟 **DEFENSE IN DEPTH CERTIFIED!** You understand that true security requires diverse, overlapping barriers so no single failure compromises the core!")
                complete_module(22)
            else:
                st.error("❌ All 4 layers must be checked! A fortress is only as strong as its weakest layer.")
                
    with tab_boss4:
        boss = get_boss_info(4)
        st.markdown(f"## 👑 {boss['name']}")
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #3a2500, #1a1000); border: 2px solid #ffd700; border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);">
            <h2 style="color: #ffd700; margin: 0;">🦹 GRANDMASTER VILLAIN: {boss['villain']}</h2>
            <p style="color: #ffffff; font-size: 1.1em; margin-top: 15px;">{boss['desc']}</p>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px; color: #00ffcc; font-weight: bold; margin-top: 15px;">
                ⚡ FINAL INSTRUCTIONS: {boss['instructions']}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.write("")
        st.markdown("### 🚀 GLOBAL METROPOLIS COMMAND CENTER")
        st.write("Phantom-X has unleashed every weapon in the arsenal simultaneously! Activate all three emergency countermeasures to save the Metropolis Grid!")
        
        p22_block = st.toggle("🛡️ Countermeasure 1: Block Port 22 and Port 3389 brute-force bot scanners on Firewall", value=True, key="boss4_p22")
        ddos_rate = st.toggle("🛡️ Countermeasure 2: Activate rate-limiting traffic shaper (<= 50 req/sec) against DDoS flood", value=True, key="boss4_ddos")
        sha_verify = st.toggle("🛡️ Countermeasure 3: Verify SHA-256 cryptographic hashes on system kernel files to detect rootkits", value=True, key="boss4_sha")
        
        if st.button("👑 EXECUTE GRAND METROPOLIS DEFENSE", key="boss4_exec", type="primary", use_container_width=True):
            res = evaluate_boss_4_defense(p22_block, ddos_rate, sha_verify)
            if res["won"]:
                st.balloons()
                st.success(f"👑 **GRANDMASTER VICTORY!** {res['message']}")
                record_boss_victory(4)
                st.toast("🎓 Diploma Certificate Unlocked in Dashboard Sidebar!", icon="🏆")
            else:
                st.error(f"❌ **METROPOLIS GRID OVERLOADED!** {res['message']}")
                cybot_web.render_cybot_error("Boss Battle 4 Failed - Ensure all three countermeasures are active")
