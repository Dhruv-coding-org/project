import streamlit as st
from engine.cybot import get_greeting, get_hint, explain_error, ask_cybot

def render_cybot_helper(module_id: int = 1):
    with st.expander("🤖 CY-BOT THE GUARDIAN AI (Click for Hints & Guidance)", expanded=False):
        st.markdown(f"""
        <div style="background: rgba(0, 255, 204, 0.05); border-left: 4px solid #00ffcc; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <b style="color: #00ffcc;">🤖 Cy-Bot says:</b><br>
            {get_greeting()}
        </div>
        """, unsafe_allow_html=True)
        
        if st.button(f"💡 Get Analogy Hint for Module {module_id}", key=f"hint_btn_{module_id}"):
            hint_text = get_hint(module_id)
            st.info(f"**🤖 Cy-Bot Hint:** {hint_text}")

def render_cybot_chat():
    st.markdown("### 🤖 Cy-Bot Interactive AI Mentor Chat")
    st.write("Confused about a cybersecurity term? Ask Cy-Bot below for simple, everyday analogies!")
    
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = [
            {"role": "assistant", "content": "Hello operative! Ask me anything about passwords, firewalls, VPNs, malware, or hacking!"}
        ]
        
    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"], avatar="🤖" if msg["role"] == "assistant" else "🕵️"):
            st.markdown(msg["content"])
            
    user_q = st.chat_input("Ask a cybersecurity question (e.g., 'what is DDoS?', 'why do I need MFA?')...")
    if user_q:
        st.session_state.chat_history.append({"role": "user", "content": user_q})
        with st.chat_message("user", avatar="🕵️"):
            st.markdown(user_q)
            
        with st.chat_message("assistant", avatar="🤖"):
            with st.spinner("🤖 Cy-Bot thinking of a fun analogy..."):
                ans = ask_cybot(user_q)
                st.markdown(ans)
        st.session_state.chat_history.append({"role": "assistant", "content": ans})

def render_cybot_error(command_or_term: str):
    st.error(f"**🤖 Cy-Bot Error Coaching:** {explain_error(command_or_term)}")
