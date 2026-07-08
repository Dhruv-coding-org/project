import random

CYBOT_GREETINGS = [
    "Beep boop! 🤖 Cy-Bot here! I'm your digital guardian. What can I help you understand today?",
    "Hello operative! 🛡️ Cy-Bot ready! Don't worry if things sound confusing—I translate hacker-speak into plain English!",
    "Greetings! ⚡ Cyber security is just like guarding a real castle. Let me know if you get stuck!"
]

MODULE_HINTS = {
    1: "💡 Hint (Module 1): Remember our paper cup telephone analogy! When data travels across an open wire without a secret lock, anyone listening on the wire can hear your private conversation!",
    2: "💡 Hint (Module 2): An IP address is like a GPS street coordinate (192.168.1.1), while a Domain Name is just the easy-to-remember name of the store (google.com)!",
    3: "💡 Hint (Module 3): Look for the lock icon! HTTP is an open postcard that hackers can read. HTTPS puts your postcard inside a locked steel briefcase!",
    4: "💡 Hint (Module 4): White Hats are the friendly digital locksmiths hired to test security. Black Hats are the burglars trying to break in and steal things!",
    5: "💡 Hint (Module 5): A short password like '123456' is like a door lock made of cardboard. Mix uppercase letters, symbols, and numbers to turn it into a titanium bank vault!",
    6: "💡 Hint (Module 6): MFA (Multi-Factor Authentication) is your superpower! Even if a hacker steals your password key, they still can't get past the 30-second rotating fingerprint token on your phone!",
    7: "💡 Hint (Module 7): Always check the sender's domain closely! Look out for tricky typos like 'paypaI.com' (with a capital i) or files ending in '.exe' disguised as invoices!",
    8: "💡 Hint (Module 8): If someone calls asking for your password or bank pin saying it's an 'urgent emergency', stop! Real banks NEVER ask for your password over the phone!",
    9: "💡 Hint (Module 9): A Trojan virus tricks you by hiding inside something you *want* (like a free game download), just like the Trojan Horse statue in ancient Greek mythology!",
    10: "💡 Hint (Module 10): A keylogger is like an invisible spy peeking over your shoulder and writing down every single key you press on your keyboard!",
    11: "💡 Hint (Module 11): Ransomware encrypts your files so you can't open them. The #1 defense is having an offline backup hard drive that the kidnapper can't reach!",
    12: "💡 Hint (Module 12): When you download an unknown file, test it in an isolated Quarantine Sandbox first—just like keeping a sick patient in a separate room so they don't infect the hospital!",
    13: "💡 Hint (Module 13): Public airport Wi-Fi is like shouting your private conversation across a crowded coffee shop. Anyone with a listening antenna can hear your data!",
    14: "💡 Hint (Module 14): A VPN (Virtual Private Network) builds a bulletproof, private underground tunnel through the public internet so eavesdroppers see nothing but solid rock!",
    15: "💡 Hint (Module 15): Think of a Firewall as a bouncer at a VIP club! Port 80 and 443 are for normal web shoppers, but if an unknown stranger tries to force open Port 22 (SSH), block them!",
    16: "💡 Hint (Module 16): SQL Injection happens when a naive robot guard blindly follows instructions. If you enter `' OR '1'='1`, the math is always true, unlocking the door!",
    17: "💡 Hint (Module 17): XSS is like sneaking a malicious instruction slip inside a public library book so the next reader gets pranked. We fix it by cleaning (encoding) all inputs!",
    18: "💡 Hint (Module 18): A cryptographic hash (like SHA-256) is a digital fingerprint. You can easily make a fingerprint from a finger, but you can NEVER turn a fingerprint back into a finger!",
    19: "💡 Hint (Module 19): A DDoS attack is when a bad guy hires thousands of fake cars to block a highway so real ambulances and shoppers can't get through!",
    20: "💡 Hint (Module 20): A Zero-Day vulnerability is a secret crack in a castle wall that the builders don't know about yet. Apply software patches immediately to fill the cracks!",
    21: "💡 Hint (Module 21): Cyber forensics is digital detective work! Every computer action leaves behind footprints in system logs.",
    22: "💡 Hint (Module 22 - Capstone): You are the Grandmaster now! Check your firewall rules, inspect incoming packet headers, quarantine suspicious files, and keep your backups ready!"
}

QNA_DATABASE = {
    "ip": "🌐 An **IP Address** (like `142.250.190.46`) is simply the unique numerical GPS coordinate assigned to every computer on the internet so packets know where to travel!",
    "dns": "📖 **DNS (Domain Name System)** is the internet's phonebook! Instead of memorizing numbers like `142.250.190.46`, DNS lets you type `google.com` and automatically looks up the number for you.",
    "http": "🔓 **HTTP** stands for HyperText Transfer Protocol. Think of it as sending a postcard through the public mail—anyone touching the postcard along the way can read your message!",
    "https": "🔒 **HTTPS** is secure HTTP! It takes your postcard and seals it inside a locked, indestructible steel briefcase using SSL/TLS encryption before sending it over the wires.",
    "firewall": "🛑 A **Firewall** is like a VIP club bouncer standing at the door of your computer network. It checks every incoming packet's ID and blocks troublemakers while letting normal shoppers through!",
    "vpn": "🚇 A **VPN (Virtual Private Network)** builds an armored, private underground tunnel across the public internet. Even if you use public airport Wi-Fi, snoops only see the outside armored wall of your tunnel!",
    "mfa": "🔑 **MFA (Multi-Factor Authentication)** requires two separate pieces of evidence to prove who you are: something you KNOW (your password) AND something you HAVE (a 6-digit code on your phone).",
    "phishing": "🎣 **Phishing** is when a cyber con-artist sends a fake email or SMS disguised as a trusted friend, bank, or company (like `paypaI.com`) to trick you into handing over your keys!",
    "ransomware": "💾 **Ransomware** is malicious software that acts like a digital kidnapper. It locks up all your files with an uncrackable code and demands ransom money. The best defense is keeping an offline backup drive!",
    "malware": "🐴 **Malware** is short for 'malicious software'. It's the umbrella term for any bad computer program—including viruses, worms, Trojans, keyloggers, and ransomware!",
    "sql": "💉 **SQL Injection (SQLi)** is a trick where a hacker types database commands into a normal website search box or login screen to fool the database into handing over secret records!",
    "xss": "📜 **XSS (Cross-Site Scripting)** is when a hacker injects malicious JavaScript code into a public website so that other users' browsers run the bad code without knowing it.",
    "ddos": "🚦 **DDoS (Distributed Denial of Service)** is when an attacker uses thousands of hijacked computers (a botnet) to flood a server with fake traffic, causing a massive digital traffic jam!",
    "zero-day": "🧱 A **Zero-Day** is a newly discovered security vulnerability that software developers haven't had zero days to fix yet! Applying software updates (patches) is how we seal these flaws.",
    "hash": "💍 A **Cryptographic Hash** (like SHA-256) converts any file or text into a unique string of characters. It acts as a digital fingerprint to verify that a file hasn't been tampered with!"
}

def get_greeting() -> str:
    return random.choice(CYBOT_GREETINGS)

def get_hint(module_id: int) -> str:
    return MODULE_HINTS.get(module_id, "💡 Remember: In cybersecurity, defense is all about layers! Check your passwords, verify domains, and keep firewalls active!")

def explain_error(command: str, context: str = "") -> str:
    cmd_lower = command.lower()
    if "block 80" in cmd_lower or "block 443" in cmd_lower or "block port 80" in cmd_lower or "block port 443" in cmd_lower:
        return "🤖 **Cy-Bot Alert**: Whoops! You just blocked Port 80 (or 443)! Think of Port 80/443 like the front doors of a grocery store—if you lock them, normal web shoppers can't get in! Try inspecting or scanning Port 22 (SSH) instead!"
    elif "123456" in cmd_lower or "password" in cmd_lower:
        return "🤖 **Cy-Bot Alert**: That password is too weak! A hacker's dictionary attack will crack it in 0.0001 seconds! Try adding uppercase letters, numbers, and symbols like `P@ssw0rd!2026`."
    elif "click" in cmd_lower and "exe" in cmd_lower:
        return "🤖 **Cy-Bot Alert**: Hold on! Never click directly on an `.exe` file sent in an email! Think of an `.exe` as a sealed mystery box—always scan it in a Quarantine Sandbox first!"
    else:
        return f"🤖 **Cy-Bot Guidance**: That didn't quite work! When attempting `{command}`, make sure you inspect the target parameters first. Type `hint` or check the module instructions!"

def ask_cybot(question: str) -> str:
    q_lower = question.lower()
    matches = []
    for key, answer in QNA_DATABASE.items():
        if key in q_lower:
            matches.append(answer)
            
    if matches:
        return "\n\n".join(matches)
    
    # Generic intelligent response if no direct keyword matches
    return ("🤖 **Cy-Bot**: That is a great question! In simple terms, cybersecurity is all about building layers of defense around our digital lives.\n"
            "Think of your computer like a house:\n"
            "• **Firewall** = The fence and security gate.\n"
            "• **Passwords & MFA** = The heavy front door deadbolt and alarm PIN.\n"
            "• **Antivirus** = The indoor security guard checking for intruders.\n"
            "• **Encryption (HTTPS/VPN)** = Speaking in a secret code so eavesdroppers outside the window can't understand you!\n\n"
            "Try asking me specifically about: `IP`, `DNS`, `HTTPS`, `Firewall`, `VPN`, `MFA`, `Phishing`, `Ransomware`, `Malware`, `SQL`, `XSS`, `DDoS`, or `Hash`!")
