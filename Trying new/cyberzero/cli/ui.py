import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, BarColumn, TextColumn
from rich.markdown import Markdown
from rich.text import Text
from engine.progress import UserProfile, RANKS, BADGE_DEFINITIONS
from engine.curriculum import CURRICULUM

console = Console(legacy_windows=False)

BANNER = """
 ██████╗██╗   ██╗██████╗ ███████╗██████╗ ████████╗███████╗██████╗  ██████╗ 
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔═══██╗
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝   ██║   █████╗  ██████╔╝██║   ██║
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗   ██║   ██╔══╝  ██╔══██╗██║   ██║
╚██████╗   ██║   ██████╔╝███████╗██║  ██║   ██║   ███████╗██║  ██║╚██████╔╝
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝ ╚═════╝ 
        [bold cyan]🛡️ FROM ABSOLUTE ZERO TO CYBER GUARDIAN 🛡️[/bold cyan]
"""

def print_banner(profile: UserProfile):
    console.print(Panel(BANNER, border_style="cyan", subtitle=f"[green]Operative: {profile.user_name} | Rank: {profile.rank_title} (Lvl {profile.level})[/green]"))

def print_status(profile: UserProfile):
    # Find next rank threshold
    next_xp = RANKS[-1][0]
    for idx, (thresh, title) in enumerate(RANKS):
        if thresh > profile.xp:
            next_xp = thresh
            break
            
    pct = min(100, int((profile.xp / max(1, next_xp)) * 100))
    
    table = Table(title="📊 CYBER OPERATIVE TELEMETRY", border_style="blue")
    table.add_column("Attribute", style="cyan", no_wrap=True)
    table.add_column("Value", style="bold white")
    
    table.add_row("Operative Name", profile.user_name)
    table.add_row("Current Rank", f"Level {profile.level}: [green]{profile.rank_title}[/green]")
    table.add_row("Total XP Earned", f"{profile.xp} / {next_xp} XP ({pct}% to next level)")
    table.add_row("Combo Streak", f"🔥 {profile.combo_streak}x Multiplier")
    table.add_row("Modules Completed", f"{len(profile.completed_modules)} / 22")
    table.add_row("Badges Unlocked", f"🏆 {len(profile.unlocked_badges)} / 22")
    table.add_row("Bosses Defeated", f"⚡ {len(profile.boss_victories)} / 4")
    table.add_row("Active UI Theme", profile.theme)
    
    console.print(table)

def print_modules_table(profile: UserProfile):
    table = Table(title="📚 CYBERZERO 22-MODULE CURRICULUM", border_style="cyan", show_lines=True)
    table.add_column("ID", style="bold yellow", width=4)
    table.add_column("Phase & Title", style="white")
    table.add_column("Everyday Analogy", style="italic cyan")
    table.add_column("Status", style="bold", justify="center")
    
    for mod_id in range(1, 23):
        mod = CURRICULUM.get(mod_id)
        if not mod: continue
        status = "[green]COMPLETED ✅[/green]" if mod_id in profile.completed_modules else "[dim]NOT STARTED 🔒[/dim]"
        title_str = f"[bold]{mod['phase']}[/bold]\nMod {mod_id}: {mod['title']}"
        # pyrefly: ignore [bad-argument-type]
        table.add_row(str(mod_id), title_str, mod['analogy'], status)
        
    console.print(table)

def print_lesson(module_info: dict):
    title = f"📖 MODULE {module_info['id']}: {module_info['title'].upper()}"
    content = f"### Phase: {module_info['phase']}\n\n"
    content += f"**💡 Everyday Analogy:** *{module_info['analogy']}*\n\n---\n\n"
    content += module_info['lesson']
    content += f"\n\n---\n**🔬 Interactive Lab Available:** `{module_info['lab_name']}`\nType `lab {module_info['id']}` to launch simulator!"
    
    console.print(Panel(Markdown(content), title=title, border_style="green", padding=(1, 2)))

def print_xp_alert(xp_res: dict):
    gained = xp_res.get("xp_gained", 0)
    reason = xp_res.get("reason", "")
    msg = f"[bold green]+{gained} XP![/bold green] ({reason})"
    if xp_res.get("bonus_amount", 0) > 0:
        msg += f" [yellow](+{xp_res['bonus_amount']} Combo Bonus! 🔥)[/yellow]"
    if xp_res.get("leveled_up", False):
        msg += f"\n[bold yellow]🎉 LEVEL UP! You are now Level {xp_res['new_level']}: {xp_res['new_title']}! 👑[/bold yellow]"
    console.print(Panel(msg, border_style="yellow"))

def print_badge_alert(badge_info: dict):
    if not badge_info: return
    msg = "[bold yellow]🏆 NEW BADGE UNLOCKED![/bold yellow]\n\n"
    msg += f"{badge_info['icon']} [bold cyan]{badge_info['name']}[/bold cyan]\n*{badge_info['desc']}*"
    console.print(Panel(msg, border_style="gold1"))

def print_trophy_room(profile: UserProfile):
    table = Table(title="🏆 OPERATIVE TROPHY ROOM (BADGES)", border_style="gold1", show_lines=True)
    table.add_column("ID", style="bold yellow", justify="center", width=4)
    table.add_column("Icon", justify="center", width=6)
    table.add_column("Badge Name", style="bold white")
    table.add_column("Description", style="dim")
    table.add_column("Status", justify="center")
    
    for badge_id in range(1, 23):
        b = BADGE_DEFINITIONS.get(badge_id)
        if not b: continue
        unlocked = badge_id in profile.unlocked_badges
        icon = b['icon'] if unlocked else "🔒"
        name = f"[gold1]{b['name']}[/gold1]" if unlocked else "[dim]Locked Badge[/dim]"
        desc = b['desc'] if unlocked else "Complete the module to unlock"
        status = "[bold green]UNLOCKED 🌟[/bold green]" if unlocked else "[dim]Locked 🔒[/dim]"
        table.add_row(str(badge_id), icon, name, desc, status)
        
    console.print(table)
