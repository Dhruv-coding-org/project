import streamlit as st
import pandas as pd
from engine.curriculum import CURRICULUM
from engine.progress import complete_module, record_boss_victory
from engine import simulators
from engine.boss_engine import get_boss_info, evaluate_boss_3_defense
from web import cybot_web
from web.tabs_phase1 import render_module_card

def render_phase_4():
    st.markdown("## 🌐 Phase 4: Web & Network Security Gatekeepers")
    st.write("Master the art of network port shielding, armored VPN tunnels, and stopping web hackers from injecting sneaky script logic into your databases!")
    
    tab13, tab14, tab15, tab16, tab17, tab_boss3 = st.tabs([
        "Mod 13: Wi-Fi Security", 
        "Mod 14: Armored VPNs", 
        "Mod 15: Firewall Gatekeeper", 
        "Mod 16: SQL Injection",
        "Mod 17: XSS Encoding",
        "⚡ BOSS BATTLE 3"
    ])
    
    with tab13:
        render_module_card(13)
        st.markdown("### 🔬 Interactive Lab: Evil Twin Rogue Wi-Fi Detector")
        st.write("You sit down at an airport terminal. Scan the surrounding wireless networks and choose the safest one:")
        networks = [
            {"SSID": "Airport_Official_Secure_WiFi", "Encryption": "WPA3-Enterprise (Requires Staff Login)", "Signal": "85%", "Risk": "SAFE 🟢"},
            {"SSID": "Free_Airport_WiFi_Fast_NoPass", "Encryption": "NONE (Open Radio Wave)", "Signal": "100%", "Risk": "🚨 EVIL TWIN ROGUE ROUTER!"},
            {"SSID": "Starbucks_Guest_WiFi", "Encryption": "WPA2 (Portal Verification)", "Signal": "60%", "Risk": "MODERATE 🟡"}
        ]
        st.table(pd.DataFrame(networks))
        chosen_net = st.radio("Which Wi-Fi network do you connect your laptop to?", [n["SSID"] for n in networks], index=0, key="lab13_net")
        if st.button("Connect to Wi-Fi", key="lab13_btn", type="primary"):
            if chosen_net == "Airport_Official_Secure_WiFi":
                st.success("✅ **Safe Connection Established!** You verified the official encrypted SSID with airport staff!")
                complete_module(13)
            elif "Free_Airport" in chosen_net:
                st.error("❌ **ROGUE ROUTER TRAP!** You just connected to an Evil Twin router set up by a hacker sitting 20 feet away! They are now recording every website you visit!")
            else:
                st.warning("🟡 Connected to public portal. Make sure your VPN is turned on before checking bank accounts!")
                
    with tab14:
        render_module_card(14)
        st.markdown("### 🔬 Interactive Lab: VPN Armored Tunnel Simulator")
        st.write("See how a VPN protects you when you are forced to use a public coffee shop network!")
        vpn_status = st.toggle("🛡️ Turn ON Virtual Private Network (VPN) Armor", value=True, key="lab14_vpn")
        if st.button("Transmit Private Banking Data", key="lab14_btn", type="primary"):
            if vpn_status:
                st.markdown("""
                <div style="background: rgba(0, 204, 255, 0.1); border: 2px solid #00ccff; border-radius: 10px; padding: 15px; text-align: center;">
                    <h3 style="color: #00ccff; margin:0;">🛡️ VPN ENCRYPTED TUNNEL ACTIVE</h3>
                    <p style="color: #fff; margin-top: 10px;">[Your Laptop] ═══🔒 AES-256 ARMORED TUNNEL 🔒═══> [Bank Server]</p>
                    <p style="color: #aaa; font-size: 0.85em;">Local eavesdroppers at the coffee shop see zero plain text!</p>
                </div>
                """, unsafe_allow_html=True)
                complete_module(14)
            else:
                st.error("❌ **Unarmored Transmission!** Your data traveled through open public radio waves without encryption armor!")
                
    with tab15:
        render_module_card(15)
        st.markdown("### 🔬 Interactive Lab: Firewall Port Gatekeeper Command Center")
        st.write("Inspect incoming network traffic trying to access your virtual doors (Ports). Activate rule sets to block unauthorized remote scanners!")
        stream = simulators.generate_firewall_stream(5)
        df_f = pd.DataFrame(stream)
        st.dataframe(df_f[["port", "protocol", "service", "ip", "risk"]], use_container_width=True, hide_index=True)
        
        rule_active = st.toggle("🛑 Enable Firewall Rule: BLOCK all traffic on Port 22 (SSH) and Port 3389 (RDP)", value=True, key="lab15_rule")
        if st.button("Evaluate Firewall Gatekeeper", key="lab15_btn", type="primary"):
            if rule_active:
                st.success("✅ **Firewall Shield Active!** The gatekeeper allowed regular shoppers into Port 443 (HTTPS), but slammed the door on brute-force bots rattling Port 22!")
                complete_module(15)
            else:
                st.error("❌ **Firewall Disabled!** Port 22 and Port 3389 are wide open to the public! Bots are currently attempting automated dictionary attacks against your administrator login!")
                
    with tab16:
        render_module_card(16)
        st.markdown("### 🔬 Interactive Lab: SQL Injection (SQLi) Sanitization Test Box")
        st.write("Test entering a sneaky SQL injection string into our simulated banking database login box:")
        sqli_input = st.text_input("Enter Login Username:", value="' OR '1'='1", key="lab16_input")
        use_sanitization = st.toggle("🛡️ Enable Input Parameterization Shield (Sanitizer)", value=False, key="lab16_toggle")
        
        if st.button("Test Database Query", key="lab16_btn", type="primary"):
            res = simulators.check_sql_injection(sqli_input, sanitized=use_sanitization)
            if res["success"]:
                st.error(f"**{res['status']}**\n\n**Raw SQL Executed:** `{res['query']}`\n\n**Why it happened:** {res['desc']}")
            else:
                st.success(f"**{res['status']}**\n\n**Safe Executed Query:** `{res['query']}`\n\n**Explanation:** {res['desc']}")
                if use_sanitization:
                    complete_module(16)
                    
    with tab17:
        render_module_card(17)
        st.markdown("### 🔬 Interactive Lab: Cross-Site Scripting (XSS) Output Encoder")
        st.write("Simulate posting a comment on a public profile page. Try entering a malicious JavaScript tag:")
        xss_input = st.text_input("Enter comment text:", value="Hello! <script>stealCookies();</script>", key="lab17_input")
        use_encoding = st.toggle("🛡️ Enable Output Character Encoding (Escaping Shield)", value=True, key="lab17_toggle")
        
        if st.button("Post Comment to Web Page", key="lab17_btn", type="primary"):
            res = simulators.check_xss_injection(xss_input, encoded=use_encoding)
            if res["executed"]:
                st.error(f"**{res['status']}**\n\n**Page Rendering:** `{res['output']}`\n\n**Impact:** {res['desc']}")
            else:
                st.success(f"**{res['status']}**\n\n**Page Rendering:** `{res['output']}`\n\n**Explanation:** {res['desc']}")
                if use_encoding:
                    complete_module(17)
                    
    with tab_boss3:
        boss = get_boss_info(3)
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
        st.markdown("### 🚀 COMMAND CENTER WEB DEFENSE CONTROL")
        st.write("Syntax-Zero is hammering your login box with `' OR '1'='1` and your comment section with `<script>stealCookies();</script>`!")
        
        col_x, col_y = st.columns(2)
        with col_x:
            sqli_shield = st.toggle("🛡️ Activate SQL Input Parameterization Shield", value=True, key="boss3_sqli")
        with col_y:
            xss_shield = st.toggle("🛡️ Activate XSS Output Encoding Shield", value=True, key="boss3_xss")
            
        if st.button("⚡ EXECUTE DUAL WEB DEFENSE SHIELD", key="boss3_exec", type="primary", use_container_width=True):
            res = evaluate_boss_3_defense(sqli_shield, xss_shield)
            if res["won"]:
                st.balloons()
                st.success(f"🏆 **BOSS VICTORY!** {res['message']}")
                record_boss_victory(3)
            else:
                st.error(f"❌ **WEB SIEGE BREACH!** {res['message']}")
                cybot_web.render_cybot_error("Boss Battle 3 Failed - Enable both Parameterization and Encoding shields")
