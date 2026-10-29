import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from engine.cybot import get_greeting, get_hint, explain_error, ask_cybot

console = Console(legacy_windows=False)

def show_cybot_greeting():
    msg = get_greeting()
    console.print(Panel(msg, title="[bold cyan]🤖 CY-BOT THE GUARDIAN AI[/bold cyan]", border_style="cyan", padding=(1, 2)))

def show_cybot_hint(module_id: int):
    msg = get_hint(module_id)
    console.print(Panel(msg, title=f"[bold yellow]🤖 CY-BOT HINT (MOD {module_id})[/bold yellow]", border_style="yellow", padding=(1, 2)))

def show_cybot_error(command: str, context: str = ""):
    msg = explain_error(command, context)
    console.print(Panel(msg, title="[bold red]🤖 CY-BOT ERROR COACHING[/bold red]", border_style="red", padding=(1, 2)))

def show_cybot_answer(question: str):
    ans = ask_cybot(question)
    console.print(Panel(Markdown(ans), title=f"[bold cyan]🤖 CY-BOT EXPLAINING: '{question}'[/bold cyan]", border_style="cyan", padding=(1, 2)))
