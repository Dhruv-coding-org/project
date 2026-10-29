import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import time
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from engine.progress import load_profile, save_profile, complete_module, record_boss_victory, increment_combo, reset_combo, reset_progress
from engine.curriculum import CURRICULUM
from engine import simulators
from engine.boss_engine import get_boss_info, evaluate_boss_1_defense, evaluate_boss_2_defense, evaluate_boss_3_defense, evaluate_boss_4_defense
from cli import ui, cybot_cli

console = Console(legacy_windows=False)

def show_help():
    table = Table(title="🛠️ CYBERZERO TERMINAL COMMAND REFERENCE", border_style="cyan")
    table.add_column("Command", style="bold yellow", width=18)
    table.add_column("Description", style="white")
    table.add_column("Example Usage", style="italic cyan")
    
    table.add_row("help", "Display this help menu", "help")
    table.add_row("status", "Check operative rank, XP, and badges", "status")
    table.add_row("modules", "List all 22 training modules", "modules")
    table.add_row("lesson <id>", "Read plain-English lesson and analogy", "lesson 1")
    table.add_row("quiz <id>", "Take multiple-choice quiz for XP", "quiz 1")
    table.add_row("lab <id>", "Launch interactive lab simulator", "lab 5")
    table.add_row("boss <id>", "Challenge one of the 4 Boss Battles", "boss 1")
    table.add_row("bot / hint", "Summon Cy-Bot for hints and advice", "bot")
    table.add_row("bot ask <q>", "Ask Cy-Bot any cyber question", "bot ask what is vpn")
    table.add_row("trophy", "View unlocked badges in Trophy Room", "trophy")
    table.add_row("reset", "Reset operative progress to Level 1", "reset")
    table.add_row("quit / exit", "Exit the CyberZero Terminal", "quit")
    
    console.print(table)

def handle_lesson(args: list):
    if not args or not args[0].isdigit():
        console.print("[red]Please specify a valid module ID (1 to 22). Example: `lesson 1`[/red]")
        return
    mod_id = int(args[0])
    mod = CURRICULUM.get(mod_id)
    if not mod:
        console.print(f"[red]Module {mod_id} not found! Choose between 1 and 22.[/red]")
        return
    ui.print_lesson(mod)
    console.print(f"[cyan]💡 Tip: Type `quiz {mod_id}` to test your knowledge or `lab {mod_id}` to play the simulator![/cyan]")

def handle_quiz(args: list):
    if not args or not args[0].isdigit():
        console.print("[red]Please specify a valid module ID (1 to 22). Example: `quiz 1`[/red]")
        return
    mod_id = int(args[0])
    mod = CURRICULUM.get(mod_id)
    if not mod or "quiz" not in mod:
        console.print(f"[red]Quiz for Module {mod_id} not found.[/red]")
        return
        
    q_data = mod["quiz"]
    console.print(Panel(f"[bold yellow]❓ QUIZ (MOD {mod_id}):[/bold yellow] {q_data['question']}", border_style="yellow"))
    for idx, opt in enumerate(q_data["options"]):
        console.print(f"  [bold cyan][{idx + 1}][/bold cyan] {opt}")
        
    ans = Prompt.ask("\nEnter your answer (1-4)", choices=["1", "2", "3", "4"], default="1")
    chosen_idx = int(ans) - 1
    
    if chosen_idx == q_data["correct_idx"]:
        increment_combo()
        console.print(f"\n[bold green]✅ CORRECT![/bold green] {q_data['explanation']}")
        res = complete_module(mod_id)
        ui.print_xp_alert(res["xp_result"])
        if res.get("new_badge_unlocked"):
            ui.print_badge_alert(res["badge_info"])
    else:
        reset_combo()
        console.print(f"\n[bold red]❌ Incorrect![/bold red] {q_data['explanation']}")
        cybot_cli.show_cybot_hint(mod_id)

def handle_lab(args: list):
    if not args or not args[0].isdigit():
        console.print("[red]Please specify a valid module ID (1 to 22). Example: `lab 1`[/red]")
        return
    mod_id = int(args[0])
    
    console.print(f"\n[bold cyan]🔬 LAUNCHING INTERACTIVE LAB SIMULATOR FOR MODULE {mod_id}...[/bold cyan]")
    
    if mod_id in [1, 3]:
        # Packet Interceptor Lab
        console.print(Panel("🌐 **Packet Interceptor Lab**: Inspecting real-time network traffic on the wire.", border_style="cyan"))
        packets = simulators.simulate_wire_tap(6)
        table = Table(title="📡 WIRE TAP TRAFFIC MONITOR", border_style="blue")
        table.add_column("ID", style="yellow", justify="center")
        table.add_column("Time", style="dim")
        table.add_column("Source IP", style="white")
        table.add_column("Destination", style="cyan")
        table.add_column("Protocol", style="bold")
        table.add_column("Status", style="bold")
        table.add_column("Payload Inspection", style="white")
        
        for p in packets:
            status_style = "green" if p["is_secure"] else "bold red"
            table.add_row(str(p["id"]), p["timestamp"], p["source_ip"], p["dest_host"], p["protocol"], f"[{status_style}]{p['status']}[/{status_style}]", p["payload"])
        console.print(table)
        console.print("[green]💡 Notice how HTTP packets reveal plain text, while HTTPS seals data in cryptographic shields![/green]")
        complete_module(mod_id)
        
    elif mod_id == 2:
        # DNS Lab
        console.print(Panel("📖 **DNS Phonebook Lookup Lab**: Type any domain name to resolve its GPS IP coordinate!", border_style="cyan"))
        domain = Prompt.ask("Enter domain name (e.g., google.com, amazon.com)", default="google.com")
        res = simulators.lookup_dns(domain)
        console.print(f"[bold green]✅ DNS Resolved:[/bold green] `{res['domain']}` -> [bold yellow]{res['resolved_ip']}[/bold yellow] ({res['status']})")
        complete_module(mod_id)
        
    elif mod_id == 5:
        # Password Cracking Speed Lab
        console.print(Panel("🏰 **Password Fortress Lab**: Test real-time brute-force cracking estimation!", border_style="cyan"))
        pwd = Prompt.ask("Type a password to test its strength", default="password123", password=False)
        res = simulators.calculate_password_entropy(pwd)
        console.print(f"\n[bold white]Password:[/bold white] `{pwd}`")
        console.print(f"[bold cyan]Mathematical Combinations:[/bold cyan] {res['combinations']}")
        console.print(f"[bold yellow]Estimated Time to Crack:[/bold yellow] {res['time_to_crack']}")
        console.print(f"[bold white]Strength Rating:[/bold white] {res['strength']} (Score: {res['score']}/100)")
        for tip in res['tips']:
            console.print(f"  💡 {tip}")
        if res['score'] >= 75:
            complete_module(mod_id)
            
    elif mod_id == 6:
        # TOTP MFA Lab
        console.print(Panel("🔑 **MFA 2FA Authenticator Lab**: Generate a rotating 6-digit one-time passcode!", border_style="cyan"))
        res = simulators.generate_totp()
        console.print(f"[bold green]🛡️ Active MFA Passcode:[/bold green] [bold yellow text-decoration='underline']{res['token']}[/bold yellow text-decoration='underline']")
        console.print(f"[dim]Expires in {res['expires_in']} seconds...[/dim]")
        code_input = Prompt.ask("Enter the 6-digit passcode to verify MFA login", default=res['token'])
        if code_input.strip() == res['token']:
            console.print("[bold green]✅ MFA Login Successful! You blocked the password thief![/bold green]")
            complete_module(mod_id)
        else:
            console.print("[bold red]❌ Incorrect passcode! Access Denied.[/bold red]")
            
    elif mod_id == 7:
        # Phishing Inbox Lab
        console.print(Panel("🎣 **Phishing Detective Inbox**: Inspect incoming emails and classify them!", border_style="cyan"))
        emails = simulators.get_phishing_emails()
        for idx, e in enumerate(emails[:3]):
            console.print(f"\n--- [bold yellow]Email #{e['id']}[/bold yellow] ---")
            console.print(f"[bold white]From:[/bold white] {e['sender']}")
            console.print(f"[bold white]Subject:[/bold white] {e['subject']}")
            console.print(f"[dim]Body:[/dim] {e['body']}")
            console.print(f"[cyan]Link Destination URL:[/cyan] {e['link_url']}")
            console.print(f"[yellow]Attachment:[/yellow] {e['attachment']}")
            
            choice = Prompt.ask("Is this email SAFE or PHISHING?", choices=["safe", "phishing"], default="phishing")
            is_correct = (choice == "phishing" and e["is_phishing"]) or (choice == "safe" and not e["is_phishing"])
            if is_correct:
                console.print(f"[bold green]✅ Correct![/bold green] {e['reason']}")
            else:
                console.print(f"[bold red]❌ Incorrect![/bold red] {e['reason']}")
        complete_module(mod_id)
        
    elif mod_id in [9, 10, 11, 12]:
        # Malware Sandbox Lab
        console.print(Panel("🏥 **Malware Quarantine Sandbox Lab**: Scan suspicious files and isolate threats!", border_style="cyan"))
        samples = simulators.get_malware_samples()
        table = Table(title="🧪 LAB CONTAINMENT SPECIMENS", border_style="red")
        table.add_column("ID", justify="center")
        table.add_column("Filename", style="bold white")
        table.add_column("Type", style="cyan")
        table.add_column("Risk Level", style="bold")
        table.add_column("Behavior Analysis", style="dim")
        for s in samples:
            table.add_row(str(s["id"]), s["filename"], s["type"], s["risk"], s["desc"])
        console.print(table)
        console.print("[bold green]🛡️ Sandbox Quarantine Shield Activated! Dangerous payloads contained.[/bold green]")
        complete_module(mod_id)
        
    elif mod_id in [15, 19]:
        # Firewall & DDoS Lab
        console.print(Panel("🛑 **Firewall Command Center Lab**: Inspect live network port connections!", border_style="cyan"))
        stream = simulators.generate_firewall_stream(5)
        table = Table(title="🚧 LIVE INCOMING PORT CONNECTIONS", border_style="yellow")
        table.add_column("Port", justify="center", style="yellow")
        table.add_column("Protocol", style="bold")
        table.add_column("Service Type", style="white")
        table.add_column("Source IP", style="cyan")
        table.add_column("Risk Assessment", style="bold")
        for st in stream:
            risk_style = "green" if st["risk"] == "SAFE" else "bold red"
            table.add_row(str(st["port"]), st["protocol"], st["service"], st["ip"], f"[{risk_style}]{st['risk']}[/{risk_style}]")
        console.print(table)
        console.print("[green]✅ Firewall Gatekeeper Rule active: All unauthorized port 22/3389/4444 traffic blocked![/green]")
        complete_module(mod_id)
        
    elif mod_id in [16, 17]:
        # Web Injection Lab
        console.print(Panel("💉 **Web Injection Gatekeeper Lab**: Test SQL injection strings and sanitization!", border_style="cyan"))
        test_str = Prompt.ask("Enter login username to test (try: `' OR '1'='1`)", default="' OR '1'='1")
        res = simulators.check_sql_injection(test_str, sanitized=False)
        console.print(f"[bold yellow]Without Sanitization:[/bold yellow] {res['status']}\n  Query: `{res['query']}`")
        console.print(f"  Result: {res['desc']}\n")
        res_safe = simulators.check_sql_injection(test_str, sanitized=True)
        console.print(f"[bold green]With Parameterization Shield ON:[/bold green] {res_safe['status']}\n  Query: `{res_safe['query']}`")
        console.print(f"  Result: {res_safe['desc']}")
        complete_module(mod_id)
        
    elif mod_id == 18:
        # Cryptography Hashing Lab
        console.print(Panel("💍 **SHA-256 Hasher Lab**: Generate one-way digital fingerprints!", border_style="cyan"))
        txt = Prompt.ask("Enter any text or password to hash", default="CyberZero_2026")
        res = simulators.calculate_sha256(txt)
        console.print(f"[bold white]Input:[/bold white] `{res['input']}`")
        console.print(f"[bold green]SHA-256 Fingerprint (64 hex characters):[/bold green]\n`{res['sha256']}`")
        complete_module(mod_id)
        
    elif mod_id == 21:
        # Forensics Log Lab
        console.print(Panel("🔬 **Cyber Forensics Log Lab**: Reconstruct intrusion timeline from system logs!", border_style="cyan"))
        logs = simulators.get_log_entries()
        table = Table(title="📜 SYSTEM SECURITY AUDIT LOGS", border_style="blue")
        table.add_column("Timestamp", style="dim")
        table.add_column("Event Description", style="white")
        table.add_column("Source IP", style="cyan")
        table.add_column("User Account", style="bold")
        table.add_column("Status Assessment", style="bold")
        for lg in logs:
            st_style = "green" if lg["status"] == "NORMAL" else "bold red"
            table.add_row(lg["time"], lg["event"], lg["ip"], lg["user"], f"[{st_style}]{lg['status']}[/{st_style}]")
        console.print(table)
        complete_module(mod_id)
        
    else:
        console.print(f"[green]✅ Lab Simulator for Module {mod_id} completed![/green]")
        complete_module(mod_id)

def handle_boss(args: list):
    if not args or not args[0].isdigit():
        console.print("[red]Please specify Boss Battle ID (1 to 4). Example: `boss 1`[/red]")
        return
    boss_id = int(args[0])
    boss = get_boss_info(boss_id)
    if not boss:
        console.print("[red]Boss Battle ID must be between 1 and 4.[/red]")
        return
        
    console.print(Panel(f"💥 **{boss['name']}** 💥\n\n**Villain:** {boss['villain']}\n**Mission:** {boss['desc']}\n\n**Instructions:** {boss['instructions']}", border_style="red", padding=(1, 2)))
    
    if not Confirm.ask("Are you ready to enter the Command Center and defend?", default=True):
        return
        
    if boss_id == 1:
        console.print("\n[bold red]⚠️ PHANTOM-X IS DICTIONARY ATTACKING YOUR VAULT! 30 SECONDS LEFT![/bold red]")
        pwd = Prompt.ask("Quick! Type a reinforced titanium password (length >= 12, symbols, digits)", default="P@ssw0rd!2026_Titanium!")
        mfa_yes = Confirm.ask("Do you activate the 2FA Authenticator shield?", default=True)
        res = evaluate_boss_1_defense(pwd, mfa_yes)
        if res["won"]:
            console.print(Panel(res["message"], border_style="bold green"))
            record_boss_victory(1)
        else:
            console.print(Panel(res["message"], border_style="bold red"))
            cybot_cli.show_cybot_hint(5)
            
    elif boss_id == 2:
        console.print("\n[bold red]⚠️ MALWARE OUTBREAK DETECTED! RANSOMWARE ENCRYPTING FILES![/bold red]")
        console.print("Files present: `company_report.docx`, `free_robux.exe`, `invoice.pdf.exe`, `system_audio.msi`, `system_crack.exe`")
        q_str = Prompt.ask("Enter filenames to QUARANTINE separated by comma", default="free_robux.exe, invoice.pdf.exe, system_crack.exe")
        q_list = [f.strip() for f in q_str.split(",")]
        backup = Confirm.ask("Trigger Offline Backup Restore shield now?", default=True)
        res = evaluate_boss_2_defense(q_list, backup)
        if res["won"]:
            console.print(Panel(res["message"], border_style="bold green"))
            record_boss_victory(2)
        else:
            console.print(Panel(res["message"], border_style="bold red"))
            cybot_cli.show_cybot_hint(11)
            
    elif boss_id == 3:
        console.print("\n[bold red]⚠️ SYNTAX-ZERO IS INJECTING SQL AND XSS PAYLOADS INTO WEB PORTAL![/bold red]")
        sqli = Confirm.ask("Enable Input Parameterization Shield for SQL queries?", default=True)
        xss = Confirm.ask("Enable Output Encoding Shield for script comments?", default=True)
        res = evaluate_boss_3_defense(sqli, xss)
        if res["won"]:
            console.print(Panel(res["message"], border_style="bold green"))
            record_boss_victory(3)
        else:
            console.print(Panel(res["message"], border_style="bold red"))
            cybot_cli.show_cybot_hint(16)
            
    elif boss_id == 4:
        console.print("\n[bold red]⚠️ FINAL CAPSTONE SIEGE: PHANTOM-X SUPREME BOTNET ATTACKING![/bold red]")
        p22 = Confirm.ask("Step 1: Block Port 22 and 3389 brute-force scanners on firewall?", default=True)
        ddos = Confirm.ask("Step 2: Activate rate-limiting traffic shaper against DDoS flood?", default=True)
        sha = Confirm.ask("Step 3: Verify SHA-256 cryptographic hashes on system kernel files?", default=True)
        res = evaluate_boss_4_defense(p22, ddos, sha)
        if res["won"]:
            console.print(Panel(res["message"], border_style="bold gold1"))
            record_boss_victory(4)
        else:
            console.print(Panel(res["message"], border_style="bold red"))
            cybot_cli.show_cybot_hint(22)

def handle_command(cmd_str: str):
    parts = cmd_str.strip().split()
    if not parts:
        return True
    action = parts[0].lower()
    args = parts[1:]
    
    profile = load_profile()
    
    if action in ["quit", "exit", "q"]:
        console.print("[bold cyan]🤖 Cy-Bot: Goodbye operative! Stay safe out there in the digital frontier![/bold cyan]")
        return False
    elif action in ["help", "?", "h"]:
        show_help()
    elif action == "status":
        ui.print_status(profile)
    elif action == "modules":
        ui.print_modules_table(profile)
    elif action == "lesson":
        handle_lesson(args)
    elif action == "quiz":
        handle_quiz(args)
    elif action == "lab":
        handle_lab(args)
    elif action == "boss":
        handle_boss(args)
    elif action in ["bot", "hint"]:
        if len(args) >= 2 and args[0].lower() == "ask":
            q = " ".join(args[1:])
            cybot_cli.show_cybot_answer(q)
        elif args and args[0].isdigit():
            cybot_cli.show_cybot_hint(int(args[0]))
        else:
            cybot_cli.show_cybot_greeting()
    elif action == "explain":
        cybot_cli.show_cybot_answer(" ".join(args))
    elif action == "trophy":
        ui.print_trophy_room(profile)
    elif action == "reset":
        if Confirm.ask("Are you sure you want to reset all operative progress to Level 1?", default=False):
            reset_progress()
            console.print("[bold green]Progress reset to Level 1: Novice Cyber Scout.[/bold green]")
    else:
        cybot_cli.show_cybot_error(cmd_str)
        console.print("[yellow]Type `help` to see valid terminal commands.[/yellow]")
    return True
