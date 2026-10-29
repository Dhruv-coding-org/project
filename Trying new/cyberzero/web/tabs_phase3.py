import streamlit as st
import pandas as pd
from engine.curriculum import CURRICULUM
from engine.progress import complete_module, record_boss_victory
from engine import simulators
from engine.boss_engine import get_boss_info, evaluate_boss_2_defense
from web import cybot_web
from web.tabs_phase1 import render_module_card

def render_phase_3():
    st.markdown("## ☣️ Phase 3: Digital Contagions & Malware Triage")
    st.write("Step inside the biological quarantine laboratory! Identify viruses, isolate keyloggers, and air-gap backup drives against ransomware bombs.")
    
    tab9, tab10, tab11, tab12, tab_boss2 = st.tabs([
        "Mod 9: Viruses & Trojans", 
        "Mod 10: Spyware & Keyloggers", 
        "Mod 11: Ransomware & Backups", 
        "Mod 12: Quarantine Sandboxes",
        "⚡ BOSS BATTLE 2"
    ])
    
    with tab9:
        render_module_card(9)
        st.markdown("### 🔬 Interactive Lab: Malware Behavioral Classifier")
        st.write("Match the malware behavior to its correct classification:")
        st.info("**Behavior:** A program disguised as a free cheat code installer for Fortnite. When ran, it secretly opens a backdoor for hackers without replicating itself.")
        mal_choice = st.radio("What type of malware is this?", ["Trojan Horse", "Computer Worm", "File-Infecting Virus"], key="lab9_radio")
        if st.button("Classify Specimen", key="lab9_btn", type="primary"):
            if "Trojan" in mal_choice:
                st.success("✅ **Correct!** Trojans rely on social engineering deception to trick you into running them!")
                complete_module(9)
            else:
                st.error("❌ Incorrect! Remember: Trojans disguise themselves as gifts or tools.")
                
    with tab10:
        render_module_card(10)
        st.markdown("### 🔬 Interactive Lab: Keylogger Process Killer")
        st.write("Inspect the active memory processes running in the background of your system:")
        processes = [
            {"PID": 1024, "Name": "System_Audio_Service.exe", "CPU": "1.2%", "Status": "Normal OS Process"},
            {"PID": 3318, "Name": "Free_Screen_Recorder_Hook.exe", "CPU": "4.8%", "Status": "⚠️ Suspicious Keyboard Buffer Hook Detected!"},
            {"PID": 4091, "Name": "Chrome_Browser.exe", "CPU": "12.5%", "Status": "Normal Web Browser"}
        ]
        st.table(pd.DataFrame(processes))
        kill_pid = st.selectbox("Select Process ID (PID) to Terminate immediately:", [1024, 3318, 4091], index=1, key="lab10_pid")
        if st.button("🛑 Terminate Process & Purge Memory", key="lab10_btn", type="primary"):
            if kill_pid == 3318:
                st.success("✅ **Keylogger Terminated!** You stopped the spy from recording your banking keystrokes!")
                complete_module(10)
            else:
                st.error("❌ Warning! You just killed a normal system process while leaving the spy running!")
                
    with tab11:
        render_module_card(11)
        st.markdown("### 🔬 Interactive Lab: 3-2-1 Air-Gapped Backup Restore")
        st.write("Simulate a ransomware infection hitting your primary hard drive. Test how an offline backup saves the day!")
        backup_state = st.radio("Where is your backup hard drive stored right now?", [
            "Plugged into my computer USB port 24/7", 
            "Physically unplugged (Air-gapped) and stored safely in a fireproof drawer", 
            "I don't have any backups"
        ], index=1, key="lab11_radio")
        if st.button("💥 Simulate Ransomware Attack", key="lab11_btn", type="primary"):
            if "Air-gapped" in backup_state:
                st.success("✅ **Ransomware Neutralized!** Even though your computer files were locked, you unplugged the infected drive, plugged in your clean offline backup, and restored 100% of your data without paying a single cent to the extortionists!")
                complete_module(11)
            else:
                st.error("❌ **Disaster!** Because your backup drive was plugged in, the ransomware encryption worm crawled across the USB cable and locked your backups too! Never leave backup drives connected 24/7!")
                
    with tab12:
        render_module_card(12)
        st.markdown("### 🔬 Interactive Lab: Quarantine Sandbox Execution Chamber")
        st.write("Select a suspicious software specimen to open inside our isolated virtual glass bubble:")
        samples = simulators.get_malware_samples()
        df_s = pd.DataFrame(samples)
        st.dataframe(df_s[["id", "filename", "type", "risk", "desc"]], use_container_width=True, hide_index=True)
        
        test_id = st.selectbox("Select Specimen ID to safely detonate in Sandbox:", [s["id"] for s in samples], index=0, key="lab12_box")
        if st.button("🧪 Detonate in Virtual Glass Sandbox", key="lab12_btn", type="primary"):
            chosen = next(s for s in samples if s["id"] == test_id)
            if "CRITICAL" in chosen["risk"] or "HIGH" in chosen["risk"]:
                st.warning(f"💥 **SANDBOX ALARM!** Specimen `{chosen['filename']}` detonated! Behavior observed: *{chosen['desc']}*")
                st.success("🛡️ **CONTAINMENT SUCCESSFUL:** The explosion was absorbed 100% by the glass sandbox bubble! Your real computer is unharmed.")
            else:
                st.info(f"🟢 Specimen `{chosen['filename']}` executed cleanly. No malicious behavior observed.")
            complete_module(12)
            
    with tab_boss2:
        boss = get_boss_info(2)
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
        st.markdown("### 🚀 COMMAND CENTER CONTAINMENT PROTOCOL")
        st.write("Select ALL malicious `.exe` or double-extension ransomware files to quarantine:")
        
        all_files = ["company_report.docx", "free_robux.exe", "invoice.pdf.exe", "system_audio_driver.msi", "system_crack.exe"]
        quarantine_selection = st.multiselect("Files to Quarantine inside Glass Chamber:", all_files, default=["free_robux.exe", "invoice.pdf.exe", "system_crack.exe"], key="boss2_files")
        backup_shield = st.toggle("🛡️ Activate 3-2-1 Offline Backup Restore Shield", value=True, key="boss2_backup")
        
        if st.button("⚡ EXECUTE CONTAINMENT & RESTORE", key="boss2_exec", type="primary", use_container_width=True):
            res = evaluate_boss_2_defense(quarantine_selection, backup_shield)
            if res["won"]:
                st.balloons()
                st.success(f"🏆 **BOSS VICTORY!** {res['message']}")
                record_boss_victory(2)
            else:
                st.error(f"❌ **CONTAINMENT FAILED!** {res['message']}")
                cybot_web.render_cybot_error("Boss Battle 2 Failed - Check your file quarantine list or toggle backup restore")
