import os
import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any

SAVE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "profile.json")

RANKS = [
    (0, "Novice Cyber Scout"),           # Level 1
    (100, "Packet Explorer"),            # Level 2
    (250, "Encryption Apprentice"),      # Level 3
    (450, "White Hat Cadet"),            # Level 4
    (700, "Password Defender"),          # Level 5
    (1000, "MFA Specialist"),            # Level 6
    (1350, "Phishing Hunter"),           # Level 7
    (1750, "Social Shield Bearer"),      # Level 8
    (2200, "Malware Medic"),             # Level 9
    (2700, "Keylogger Detector"),        # Level 10
    (3250, "Ransomware Rescuer"),        # Level 11
    (3850, "Quarantine Warden"),         # Level 12
    (4500, "Wi-Fi Sentinel"),            # Level 13
    (5200, "VPN Tunnel Master"),         # Level 14
    (5950, "Firewall Gatekeeper"),       # Level 15
    (6750, "SQL Gatekeeper"),            # Level 16
    (7600, "XSS Script Purifier"),       # Level 17
    (8500, "Cryptography Knight"),       # Level 18
    (9450, "DDoS Traffic Shaper"),       # Level 19
    (10450, "Zero-Day Hunter"),          # Level 20
    (11500, "Forensic Investigator"),    # Level 21
    (12600, "Grandmaster Cyber Guardian") # Level 22
]

BADGE_DEFINITIONS = {
    1: {"name": "Cup Telephone Wire-Tapper", "icon": "📞", "desc": "Completed Module 1: Computer Networks"},
    2: {"name": "GPS Address Navigator", "icon": "🗺️", "desc": "Completed Module 2: IP Addresses & DNS"},
    3: {"name": "Steel Briefcase Locksmith", "icon": "🔒", "desc": "Completed Module 3: HTTP vs HTTPS"},
    4: {"name": "White Hat Knight", "icon": "🧙‍♂️", "desc": "Completed Module 4: Why Hackers Hack"},
    5: {"name": "Bank Vault Architect", "icon": "🏰", "desc": "Completed Module 5: Passwords & Brute Force"},
    6: {"name": "Dual-Key Token Master", "icon": "🔑", "desc": "Completed Module 6: Multi-Factor Authentication"},
    7: {"name": "Email Detective Badge", "icon": "🕵️‍♂️", "desc": "Completed Module 7: Phishing & Spoofing"},
    8: {"name": "Mind Shield Specialist", "icon": "🛡️", "desc": "Completed Module 8: Social Engineering"},
    9: {"name": "Trojan Horse Tamer", "icon": "🐴", "desc": "Completed Module 9: Malware Viruses & Worms"},
    10: {"name": "Keyboard Watchdog", "icon": "👀", "desc": "Completed Module 10: Spyware & Keyloggers"},
    11: {"name": "Backup Vault Rescuer", "icon": "💾", "desc": "Completed Module 11: Ransomware Defense"},
    12: {"name": "Quarantine Surgeon", "icon": "🏥", "desc": "Completed Module 12: Antivirus & Sandboxes"},
    13: {"name": "Coffee Shop Wi-Fi Shield", "icon": "☕", "desc": "Completed Module 13: Wi-Fi Security"},
    14: {"name": "Underground Tunnel Builder", "icon": "🚇", "desc": "Completed Module 14: VPN Encryption"},
    15: {"name": "VIP Club Bouncer", "icon": "🛑", "desc": "Completed Module 15: Firewalls & Ports"},
    16: {"name": "SQL Input Sanitizer", "icon": "🧹", "desc": "Completed Module 16: SQL Injection Defense"},
    17: {"name": "Script Purifier", "icon": "📜", "desc": "Completed Module 17: XSS Script Injection"},
    18: {"name": "Secret Decoder Ring", "icon": "💍", "desc": "Completed Module 18: Cryptography & Hashing"},
    19: {"name": "Traffic Jam Director", "icon": "🚦", "desc": "Completed Module 19: DDoS Mitigation"},
    20: {"name": "Castle Wall Repairer", "icon": "🧱", "desc": "Completed Module 20: Zero-Day Patching"},
    21: {"name": "Digital Fingerprint Analyst", "icon": "🔬", "desc": "Completed Module 21: Cyber Forensics"},
    22: {"name": "Core Grid Grandmaster", "icon": "👑", "desc": "Completed Module 22: Capstone Grid Defense"}
}

@dataclass
class UserProfile:
    user_name: str = "Cyber Operative"
    xp: int = 0
    level: int = 1
    rank_title: str = "Novice Cyber Scout"
    completed_modules: List[int] = field(default_factory=list)
    unlocked_badges: List[int] = field(default_factory=list)
    combo_streak: int = 0
    boss_victories: List[int] = field(default_factory=list)
    theme: str = "Cyberpunk Neon"

def get_rank_info(xp: int):
    current_lvl = 1
    current_title = RANKS[0][1]
    for idx, (thresh_xp, title) in enumerate(RANKS):
        if xp >= thresh_xp:
            current_lvl = idx + 1
            current_title = title
        else:
            break
    return current_lvl, current_title

def load_profile() -> UserProfile:
    if os.path.exists(SAVE_FILE):
        try:
            with open(SAVE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                profile = UserProfile(**data)
                lvl, title = get_rank_info(profile.xp)
                profile.level = lvl
                profile.rank_title = title
                return profile
        except Exception:
            pass
    return UserProfile()

def save_profile(profile: UserProfile):
    lvl, title = get_rank_info(profile.xp)
    profile.level = lvl
    profile.rank_title = title
    try:
        with open(SAVE_FILE, "w", encoding="utf-8") as f:
            json.dump(asdict(profile), f, indent=2)
    except Exception as e:
        print(f"Error saving profile: {e}")

def add_xp(amount: int, reason: str = "") -> Dict[str, Any]:
    profile = load_profile()
    old_lvl = profile.level
    
    # Apply combo streak bonus
    bonus = 0
    if profile.combo_streak > 1:
        bonus = int(amount * (min(profile.combo_streak, 5) * 0.1))
    
    total_gained = amount + bonus
    profile.xp += total_gained
    new_lvl, new_title = get_rank_info(profile.xp)
    
    leveled_up = new_lvl > old_lvl
    profile.level = new_lvl
    profile.rank_title = new_title
    
    save_profile(profile)
    return {
        "xp_gained": total_gained,
        "base_amount": amount,
        "bonus_amount": bonus,
        "leveled_up": leveled_up,
        "new_level": new_lvl,
        "new_title": new_title,
        "reason": reason
    }

def increment_combo():
    profile = load_profile()
    profile.combo_streak += 1
    save_profile(profile)
    return profile.combo_streak

def reset_combo():
    profile = load_profile()
    profile.combo_streak = 0
    save_profile(profile)

def complete_module(module_id: int) -> Dict[str, Any]:
    profile = load_profile()
    new_badge = False
    xp_result = {}
    
    if module_id not in profile.completed_modules:
        profile.completed_modules.append(module_id)
        if module_id not in profile.unlocked_badges and module_id in BADGE_DEFINITIONS:
            profile.unlocked_badges.append(module_id)
            new_badge = True
        save_profile(profile)
        xp_result = add_xp(150, f"Completed Module {module_id}!")
    else:
        xp_result = add_xp(25, f"Replayed Module {module_id}!")
        
    badge_info = BADGE_DEFINITIONS.get(module_id, None) if new_badge else None
    return {
        "already_completed": not new_badge,
        "new_badge_unlocked": new_badge,
        "badge_info": badge_info,
        "xp_result": xp_result
    }

def record_boss_victory(boss_id: int) -> Dict[str, Any]:
    profile = load_profile()
    first_time = False
    if boss_id not in profile.boss_victories:
        profile.boss_victories.append(boss_id)
        first_time = True
        save_profile(profile)
        xp_res = add_xp(300, f"Defeated Boss Battle {boss_id}!")
    else:
        xp_res = add_xp(50, f"Replayed Boss Battle {boss_id}!")
    return {
        "first_time": first_time,
        "xp_result": xp_res
    }

def reset_progress():
    p = UserProfile()
    save_profile(p)
    return p
