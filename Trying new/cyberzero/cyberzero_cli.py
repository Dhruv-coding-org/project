#!/usr/bin/env python3
import sys
from pathlib import Path

# Ensure root package folder is in sys.path for IDEs and terminal runners
_root = str(Path(__file__).resolve().parent)
if _root not in sys.path:
    sys.path.insert(0, _root)

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.prompt import Prompt
from engine.progress import load_profile
from cli import ui, commands, cybot_cli

console = Console(legacy_windows=False)

def main():
    profile = load_profile()
    ui.print_banner(profile)
    console.print("[green]Welcome to CyberZero Terminal RPG! Type `help` for a list of commands.[/green]")
    cybot_cli.show_cybot_greeting()
    
    running = True
    while running:
        try:
            profile = load_profile()
            prompt_str = f"[bold cyan]cyberzero[/bold cyan]([green]{profile.rank_title}[/green])> "
            user_input = Prompt.ask(prompt_str)
            running = commands.handle_command(user_input)
        except (KeyboardInterrupt, EOFError):
            console.print("\n[bold cyan]🤖 Cy-Bot: Terminal session closed. See you next time![/bold cyan]")
            break
        except Exception as e:
            console.print(f"[bold red]System Error:[/bold red] {e}")

if __name__ == "__main__":
    main()
