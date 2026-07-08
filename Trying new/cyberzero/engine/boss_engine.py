import random

BOSS_BATTLES = {
    1: {
        "id": 1,
        "name": "⚡ Boss Battle 1: Defend the Login Vault!",
        "villain": "Phantom-X (Automated Dictionary Bot)",
        "desc": "Phantom-X has launched an automated dictionary brute-force attack against your bank vault! You have 30 seconds to reinforce the password requirements and activate 2FA before the locks shatter!",
        "required_module": 5,
        "waves": 3,
        "instructions": "Type a password with at least 12 characters, symbols (!@#$), numbers, and uppercase letters to achieve a score >= 80 and activate your 2FA shield!"
    },
    2: {
        "id": 2,
        "name": "⚡ Boss Battle 2: The Malware Outbreak!",
        "villain": "The Glitch Worm & Ransomware Syndicate",
        "desc": "A malicious worm has infiltrated the hospital network! Suspicious files are dropping everywhere and a ransomware countdown has started!",
        "required_module": 12,
        "waves": 3,
        "instructions": "Quarantine all files with '.exe' or double-extensions (like '.pdf.exe') and trigger the Offline Backup Restore shield!"
    },
    3: {
        "id": 3,
        "name": "⚡ Boss Battle 3: The Web Siege!",
        "villain": "Syntax-Zero (Web Injection Specialist)",
        "desc": "Syntax-Zero is hammering your online banking login and comment forms with SQL injection strings and XSS script tags!",
        "required_module": 17,
        "waves": 3,
        "instructions": "Toggle the Input Parameterization and Output Encoding shields to block all `' OR '1'='1` and `<script>` payloads!"
    },
    4: {
        "id": 4,
        "name": "⚡ Final Capstone Boss Battle: The Global Grid Defense!",
        "villain": "Phantom-X Supreme Botnet",
        "desc": "This is it, Grandmaster! Phantom-X has unleashed a synchronized multi-vector attack: DDoS floods, brute-force SSH scans, and phishing bombs simultaneously!",
        "required_module": 22,
        "waves": 4,
        "instructions": "Block Port 22/3389 attackers on the firewall, activate rate-limiting for DDoS traffic, and verify file hashes to save the Metropolis Core Grid!"
    }
}

def get_boss_info(boss_id: int):
    return BOSS_BATTLES.get(boss_id, BOSS_BATTLES[1])

def get_all_bosses():
    return [(b["id"], b["name"], b["villain"]) for b in BOSS_BATTLES.values()]

def evaluate_boss_1_defense(password: str, mfa_enabled: bool):
    from engine.simulators import calculate_password_entropy
    res = calculate_password_entropy(password)
    score = res["score"]
    # pyrefly: ignore [unsupported-operation]
    if score >= 80 and mfa_enabled:
        return {"won": True, "message": "🏆 VICTORY! Your titanium password and MFA token shattered Phantom-X's brute force botnet!"}
    # pyrefly: ignore [unsupported-operation]
    elif score >= 80 and not mfa_enabled:
        return {"won": False, "message": "⚠️ Almost there! Your password is strong, but you MUST enable the 2FA Authenticator shield to stop credential stuffing!"}
    else:
        return {"won": False, "message": f"❌ Defense Failed! Your password score is only {score}/100. Phantom-X cracked it in {res['time_to_crack']}! Add more symbols and length!"}

def evaluate_boss_2_defense(quarantined_files: list, backup_restored: bool):
    # Expect bad files to be quarantined
    bad_files = ["free_robux.exe", "invoice.pdf.exe", "system_crack.exe"]
    correct = all(f in quarantined_files for f in bad_files)
    if correct and backup_restored:
        return {"won": True, "message": "🏆 VICTORY! You successfully quarantined the ransomware worms and restored clean offline backups!"}
    else:
        return {"won": False, "message": "❌ Defense Failed! You either missed a dangerous '.exe' file or forgot to activate the Offline Backup Restore shield!"}

def evaluate_boss_3_defense(sqli_shield: bool, xss_shield: bool):
    if sqli_shield and xss_shield:
        return {"won": True, "message": "🏆 VICTORY! Parameterization and output encoding completely neutralized Syntax-Zero's web injection siege!"}
    else:
        return {"won": False, "message": "❌ Defense Failed! Both SQL Sanitization and XSS Encoding shields must be active to stop web attacks!"}

def evaluate_boss_4_defense(port22_blocked: bool, ddos_shield: bool, hash_verified: bool):
    if port22_blocked and ddos_shield and hash_verified:
        return {"won": True, "message": "👑 GRANDMASTER VICTORY! You defended the Global Grid against all vectors! Your Diploma is now unlocked!"}
    else:
        return {"won": False, "message": "❌ Defense Failed! Make sure you block Port 22 SSH scans, activate DDoS rate-limiting, and verify SHA-256 hashes!"}
