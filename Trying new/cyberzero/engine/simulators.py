import random
import hashlib
import time
import re

def simulate_wire_tap(count: int = 5):
    packets = []
    destinations = ["shop.amazon.com", "bank-secure.com", "social-chat.org", "login.portal.net", "weather-news.com"]
    for i in range(count):
        is_https = random.choice([True, False])
        dest = random.choice(destinations)
        if is_https:
            raw_payload = f"USER_LOGIN_TOKEN_{random.randint(1000,9999)}_SECRET"
            enc_hex = hashlib.sha256(raw_payload.encode()).hexdigest()[:32]
            payload = f"🔒 [ENCRYPTED SSL/TLS DATA]: {enc_hex}..."
            status = "SECURE (HTTPS)"
        else:
            user = random.choice(["alice_99", "bob_gamer", "charlie_dev"])
            pwd = random.choice(["password123", "sunshine1", "qwerty2026", "secret_admin"])
            payload = f"🔓 [PLAIN TEXT]: username={user}&password={pwd}&cc=4532-8810-9921-0012"
            status = "VULNERABLE (HTTP)"
        
        packets.append({
            "id": i + 1,
            "timestamp": time.strftime("%H:%M:%S"),
            "source_ip": f"192.168.1.{random.randint(10, 50)}",
            "dest_host": dest,
            "protocol": "HTTPS" if is_https else "HTTP",
            "status": status,
            "payload": payload,
            "is_secure": is_https
        })
    return packets

def lookup_dns(domain: str):
    dns_map = {
        "google.com": "142.250.190.46",
        "amazon.com": "205.251.242.103",
        "github.com": "140.82.121.4",
        "paypal.com": "64.4.250.37",
        "netflix.com": "54.237.226.164",
        "cyberzero.org": "127.0.0.1 (Local Fortress)"
    }
    clean_domain = domain.lower().strip().replace("http://", "").replace("https://", "")
    ip = dns_map.get(clean_domain, f"{random.randint(40,180)}.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}")
    return {"domain": clean_domain, "resolved_ip": ip, "status": "Success (DNS Looked up from Phonebook)"}

def calculate_password_entropy(password: str):
    length = len(password)
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)
    
    pool_size = 0
    if has_lower: pool_size += 26
    if has_upper: pool_size += 26
    if has_digit: pool_size += 10
    if has_special: pool_size += 32
    
    if pool_size == 0 or length == 0:
        return {"entropy": 0, "time_to_crack": "0.0001 seconds", "strength": "Very Weak", "score": 0, "tips": ["Type a password to test!"]}
    
    # Calculate combinations
    combinations = pool_size ** length
    # Assume 100 billion guesses per second for modern GPU cluster
    guesses_per_sec = 100_000_000_000
    seconds = combinations / guesses_per_sec
    
    if seconds < 0.01:
        time_str = "0.001 seconds (Instant!)"
        strength = "Very Weak 🔴"
        score = 10
    elif seconds < 60:
        time_str = f"{int(seconds)} seconds"
        strength = "Weak 🟠"
        score = 30
    elif seconds < 3600:
        time_str = f"{int(seconds/60)} minutes"
        strength = "Moderate 🟡"
        score = 50
    elif seconds < 86400 * 30:
        time_str = f"{int(seconds/86400)} days"
        strength = "Good 🟢"
        score = 75
    elif seconds < 86400 * 365 * 100:
        time_str = f"{int(seconds/(86400*365))} years"
        strength = "Strong 🔵"
        score = 90
    else:
        time_str = "400 Billion+ Years (Uncrackable!) 🚀"
        strength = "Titanium Fortress 🛡️"
        score = 100
        
    tips = []
    if length < 10: tips.append("Add more characters! Length is #1 for security.")
    if not has_upper: tips.append("Add uppercase letters (A-Z).")
    if not has_digit: tips.append("Add numbers (0-9).")
    if not has_special: tips.append("Add symbols (!@#$%^&*).")
    if not tips: tips.append("🌟 Titanium Password! Even supercomputers cannot brute-force this in our lifetime.")
    
    return {
        "entropy": int(length * (pool_size ** 0.3)),
        "combinations": f"{combinations:,.0f}",
        "time_to_crack": time_str,
        "strength": strength,
        "score": score,
        "tips": tips
    }

def generate_totp():
    now = int(time.time())
    remaining_seconds = 30 - (now % 30)
    # Generate deterministic 6 digit based on current 30-second window
    window = now // 30
    random.seed(window)
    code = f"{random.randint(100000, 999999)}"
    random.seed() # reset seed
    return {"token": code, "expires_in": remaining_seconds}

def get_phishing_emails():
    return [
        {
            "id": 1,
            "sender": "support@paypaI-security-update.com",
            "subject": "⚠️ URGENT: Your PayPal account has been restricted!",
            "body": "Dear Customer, we detected unauthorized login attempts from Russia. Click below within 24 hours or your funds will be permanently frozen!",
            "link_text": "Verify My PayPal Account Now",
            "link_url": "http://paypaI-security-update.com/login.exe",
            "attachment": "account_freeze_notice.exe",
            "is_phishing": True,
            "reason": "🚨 PHISHING SCAM! Notice the domain 'paypaI' uses a capital 'I' instead of 'l', the link is unencrypted HTTP leading to an '.exe' file, and it uses extreme urgency!"
        },
        {
            "id": 2,
            "sender": "no-reply@amazon.com",
            "subject": "Your order #108-9921841-882103 has shipped",
            "body": "Hi Alice, your order of 'Wireless Noise-Canceling Headphones' has shipped via UPS. Estimated delivery is Friday. Track your package below.",
            "link_text": "Track Package on Amazon.com",
            "link_url": "https://www.amazon.com/gp/your-account/order-tracking",
            "attachment": "None",
            "is_phishing": False,
            "reason": "✅ SAFE! The sender domain is official amazon.com, the link goes to legitimate encrypted HTTPS amazon.com, and there is no threatening language."
        },
        {
            "id": 3,
            "sender": "ceo.office.executive@gmail-corporate-suite.net",
            "subject": "Quick favor needed immediately!",
            "body": "I am currently stuck in a board meeting with no phone signal. I need you to purchase five $100 Apple iTunes gift cards for client rewards right now. I will reimburse you by tonight.",
            "link_text": "Reply with Gift Card Codes Here",
            "link_url": "mailto:scammer_wallet@darknet.org",
            "attachment": "None",
            "is_phishing": True,
            "reason": "🚨 SCAM (CEO Whaling)! Executives NEVER email junior staff asking to buy retail iTunes/Apple gift cards for client rewards!"
        },
        {
            "id": 4,
            "sender": "security-alert@chase-bank-verify.net",
            "subject": "Unusual debit card activity detected",
            "body": "We declined a $499.00 charge at BestBuy. If you did not make this purchase, please download and complete the attached dispute form immediately.",
            "link_text": "Download Dispute Form",
            "link_url": "http://chase-bank-verify.net/dispute_form.pdf.exe",
            "attachment": "dispute_form.pdf.exe",
            "is_phishing": True,
            "reason": "🚨 MALWARE PHISHING! Look at the attachment: 'dispute_form.pdf.exe' is a double-extension trick concealing a dangerous executable virus!"
        },
        {
            "id": 5,
            "sender": "notifications@github.com",
            "subject": "[GitHub] Your personal access token will expire in 7 days",
            "body": "Your token 'vscode_deploy_key' will expire on July 15. If this token is still needed, please generate a new one from your developer settings.",
            "link_text": "Review Token Settings",
            "link_url": "https://github.com/settings/tokens",
            "attachment": "None",
            "is_phishing": False,
            "reason": "✅ SAFE! Official GitHub notifications domain, HTTPS link directly to your official profile settings, no sketchy attachments or demands for gift cards."
        }
    ]

def get_malware_samples():
    return [
        {"id": 1, "filename": "Cyberpunk_2077_FREE_Crack.exe", "type": "Trojan Horse", "risk": "CRITICAL 🔴", "desc": "Disguised as a free game crack, but secretly opens a backdoor Port 3389 for hackers to control your desktop."},
        {"id": 2, "filename": "system_audio_driver_update.msi", "type": "Safe Driver", "risk": "SAFE 🟢", "desc": "Legitimate Microsoft digitally signed audio hardware driver update."},
        {"id": 3, "filename": "Free_Robux_Generator_Tool.exe", "type": "Keylogger Spyware", "risk": "HIGH 🟠", "desc": "Hooks into your keyboard buffer to secretly record Roblox and Discord passwords!"},
        {"id": 4, "filename": "tax_return_invoice_2026.pdf.exe", "type": "Ransomware Worm", "risk": "CRITICAL 🔴", "desc": "Uses double-extension trick. When opened, it encrypts all hard drive files with RSA-2048 and displays a Bitcoin ransom note!"},
        {"id": 5, "filename": "company_meeting_notes.docx", "type": "Safe Document", "risk": "SAFE 🟢", "desc": "Standard Word document containing clean text formatting without macro scripts."}
    ]

def check_sql_injection(input_str: str, sanitized: bool):
    raw_query = f"SELECT * FROM users WHERE username = '{input_str}' AND password = '***'"
    if sanitized:
        return {
            "query": f"SELECT * FROM users WHERE username = ? [BOUND PARAMETER: '{input_str}']",
            "success": False,
            "status": "🛡️ ATTACK BLOCKED BY SANITIZATION!",
            "desc": "Because Input Parameterization was enabled, the database treated your input as harmless text instead of executable command logic!"
        }
    else:
        is_sqli = "' or '" in input_str.lower() or "' or 1=1" in input_str.lower() or "'--" in input_str
        if is_sqli:
            return {
                "query": raw_query,
                "success": True,
                "status": "⚠️ DATABASE BREACHED! (SQL INJECTION SUCCESSFUL)",
                "desc": "The database evaluated `' OR '1'='1` as mathematically TRUE! Admin vault unlocked without a password!"
            }
        else:
            return {
                "query": raw_query,
                "success": False,
                "status": "❌ Login Failed (Normal check)",
                "desc": "Normal text did not alter the SQL query structure. Access denied without correct password."
            }

def check_xss_injection(input_str: str, encoded: bool):
    if encoded:
        safe_str = input_str.replace("<", "&lt;").replace(">", "&gt;")
        return {
            "output": f"Comment displayed on page: {safe_str}",
            "executed": False,
            "status": "🛡️ XSS ATTACK NEUTRALIZED BY ENCODING!",
            "desc": "The browser rendered `<script>` as harmless text characters `&lt;script&gt;` instead of running it as a malicious script!"
        }
    else:
        is_xss = "<script>" in input_str.lower() or "onload=" in input_str.lower() or "onerror=" in input_str.lower()
        if is_xss:
            return {
                "output": f"⚠️ [BROWSER EXECUTING SCRIPT]: {input_str}",
                "executed": True,
                "status": "🚨 XSS INJECTION SUCCESSFUL! SESSION COOKIE STOLEN!",
                "desc": "Because output encoding was off, innocent users viewing this comment just had their login session cookies stolen by the script!"
            }
        else:
            return {
                "output": f"Comment displayed on page: {input_str}",
                "executed": False,
                "status": "Normal Text Comment",
                "desc": "Normal comment displayed safely."
            }

def generate_firewall_stream(count: int = 6):
    services = [
        {"port": 443, "protocol": "HTTPS", "service": "Secure Web Browsing", "risk": "SAFE", "ip": "142.250.190.46"},
        {"port": 80, "protocol": "HTTP", "service": "Standard Web Traffic", "risk": "SAFE", "ip": "54.237.226.164"},
        {"port": 22, "protocol": "SSH", "service": "Brute-Force Remote Login Attempt", "risk": "MALICIOUS 🔴", "ip": "185.220.101.5 (Known Botnet)"},
        {"port": 3389, "protocol": "RDP", "service": "Unauthorized Remote Desktop Scan", "risk": "MALICIOUS 🔴", "ip": "193.186.4.102"},
        {"port": 53, "protocol": "DNS", "service": "Domain Name Resolution", "risk": "SAFE", "ip": "8.8.8.8 (Google DNS)"},
        {"port": 4444, "protocol": "TCP", "service": "Metasploit Reverse Shell Backdoor Ping", "risk": "CRITICAL 🔴", "ip": "45.133.1.89"}
    ]
    return random.sample(services, min(count, len(services)))

def calculate_sha256(text: str):
    hash_val = hashlib.sha256(text.encode('utf-8')).hexdigest()
    return {"input": text, "sha256": hash_val, "length": len(hash_val)}

def get_log_entries():
    return [
        {"time": "02:14:05", "event": "Successful SSH Admin Login", "ip": "192.168.1.10", "user": "admin", "status": "NORMAL"},
        {"time": "03:41:12", "event": "50 Failed Login Attempts in 10 sec", "ip": "185.220.101.5", "user": "root", "status": "SUSPICIOUS (Brute Force)"},
        {"time": "03:41:13", "event": "Login Success (root)", "ip": "185.220.101.5", "user": "root", "status": "BREACH ALERT 🚨"},
        {"time": "03:42:01", "event": "File Created: /tmp/backdoor.exe", "ip": "185.220.101.5", "user": "root", "status": "MALWARE DROP 🔴"},
        {"time": "03:45:00", "event": "Outbound connection to 45.133.1.89", "ip": "185.220.101.5", "user": "root", "status": "DATA EXFILTRATION 🔴"}
    ]
