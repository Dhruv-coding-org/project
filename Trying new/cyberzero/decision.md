# Decision Record & Architecture Guide: CyberZero

## 1. Overview & Purpose
**CyberZero** is an interactive, gamified cybersecurity learning platform created for absolute beginners with zero coding experience. It uses intuitive everyday analogies (club bouncers, secret locked briefcases, Trojan horse statues, and naive security guards) to demystify computer networks, cryptography, web vulnerabilities, and defensive operations.

---

## 2. Architecture & Component Guide

### 2.1 Dual-Interface Architecture
CyberZero is designed with a dual-interface model that shares a single unified state file (`profile.json`):
1. **Interactive Terminal RPG (`cyberzero_cli.py`)**: A command-line game built with Python's `rich` library for an authentic hacker terminal experience.
2. **Visual Command Center (`cyberzero_app.py`)**: A Streamlit web dashboard with interactive sliders, charts, phishing email inspection, and visual trophy cabinets.
3. **Standalone Web Academy (`web/index.html`)**: A lightweight client dashboard with interactive visual simulations, audio effects, and CyBot mentor.

### 2.2 Visual Identity & Design System Alignment (`.agents/design.md`)
The visual interfaces across Streamlit and the web dashboard adhere strictly to the Tactical Defense Console standards defined in `../../.agents/design.md`:
- **5-Colour Tactical Defense Palette**:
  - Base Background: Deep obsidian tactical console base (`#0C0E14`)
  - Elevated Container / Card: Subdued slate navy surface (`#141824`)
  - Border / Contour: Precision engineering border (`#202638`)
  - High Contrast Text: High-contrast paper white (`#EEF2F6`)
  - Focused Accent: Tactical sky cyan (`#0284C7`; non-neon, WCAG AA compliant on dark backgrounds; hover `#0369A1`)
- **Typography & Font Hierarchy**:
  - Replaced generic system fonts and Outfit with `Plus Jakarta Sans` for UI elements and `JetBrains Mono` for code snippets, telemetry, and terminal streams.
  - Scale adheres strictly to the Major Third ($1.250$) proportional progression.
- **Anti-Template Enforcement**:
  - Stripped glowing text shadows (`text-shadow: 0 0 10px...`), scanline overlays, neon gradient buttons, and radial background glow orbs from both the Streamlit app (`cyberzero_app.py`) and the web client (`web/style.css`, `web/index.html`).
  - Replaced all emojis in navigation sidebars, headers, action buttons, and curriculum tabs with curated semantic SVGs.

### 2.3 Engine Modules (`engine/`)
- **[curriculum.py](./engine/curriculum.py)**:
  Contains the 22-module structured curriculum split across 5 progressive phases:
  - *Phase 1: Foundation & The Digital World* (IP addresses, packets, DNS, ports).
  - *Phase 2: Personal Protection & Identity* (passwords, MFA, social engineering).
  - *Phase 3: Digital Contagions & Malware* (viruses, trojans, ransomware, worms).
  - *Phase 4: Web & Network Security* (HTTPS, certificates, firewalls, XSS, SQLi).
  - *Phase 5: Advanced Defense & Cryptography* (symmetric/asymmetric encryption, hashing, incident response).
- **[simulators.py](./engine/simulators.py)**: Safe in-memory simulated environments for hands-on labs (password cracking time estimator, phishing header inspector, Caesar cipher / SHA-256 playground).
- **[boss_engine.py](./engine/boss_engine.py)**: Handles culminating boss encounters testing accumulated knowledge under timed conditions.
- **[cybot.py](./engine/cybot.py)**: AI mentor engine providing context-specific hints, ELI5 analogies, and encouragement.
- **[progress.py](./engine/progress.py)**: State persistence manager serializing progress, XP, badges, and completed labs to `profile.json`.

### 2.4 Command Line Interface (`cli/`)
- **`commands.py`**: Command parser and handler for commands like `status`, `modules`, `lesson <N>`, `lab <N>`, `boss <N>`, `hint`, and `reset`.
- **`ui.py`**: Terminal formatting, tables, color-coded status badges, and ASCII art headers.
- **`cybot_cli.py`**: Terminal REPL interface for conversing with the CyBot assistant.

### 2.5 Web Dashboard (`web/`)
- **`tabs_phase1.py` - `tabs_phase5.py`**: Modular Streamlit components rendering lesson slides, interactive quiz widgets, and practical labs.
- **`dashboard.py`**: Overview page with radar skill charts, XP counters, and unlocked achievements.
- **`style.css`**: Tactical defense console theme customized for beginner clarity.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `992e7c2` | Initial conception: "Want to learn cybersecurity" | Formulated the 22-module beginner curriculum using plain English analogies instead of overwhelming technical jargon. |
| `992e7c2` | Unified dual-mode runtime (CLI + Streamlit) | Enabled users to choose between a cool terminal interface and an intuitive graphical dashboard without losing state. |
| `c12f779` | Safety checks and simulator refinement | Ensured all labs run strictly in memory without executing dangerous local system commands or opening real network ports. |
| `audit-fix` | Atomic state serialization, unit test suite & tracking recovery | Replaced non-atomic file writes with PID-isolated temp files and atomic rename in `engine/progress.py`; created comprehensive unit test suite (`test_cyberzero.py`); restored Git tracking in root `.gitignore`. |
| `sec-hardening` | Added .env.example & relative path documentation | Added environment configuration template for `PYTHONPATH` and converted absolute file URLs to relative links. |
| `path-portability` | Anonymized absolute paths in docs and pyright | Replaced machine-specific Windows paths with portable relative paths in `BEGINNER_WALKTHROUGH.md` and `pyrightconfig.json`. |
| `design-system-audit` | Anti-template overhaul & design system token adoption | Replaced generic fonts with `Plus Jakarta Sans` / `JetBrains Mono`; eliminated neon text shadows, scanline overlays, and glow orbs; replaced UI emojis in sidebar/header navigation with curated SVG icons; implemented 5-colour tactical defense palette (`#0C0E14`, `#141824`, `#191E2D`, `#202638`, `#EEF2F6`, `#0284C7`) complying with `.agents/design.md`. |

---

## 4. Usage & Running Instructions

### Prerequisites
Ensure Python 3.8+ is installed.

### Option A: Terminal RPG Mode
```bash
cd "Trying new/cyberzero"
python cyberzero_cli.py
```
Type `help` for available commands or `lesson 1` to start.

### Option B: Visual Streamlit Web Dashboard
```bash
cd "Trying new/cyberzero"
pip install -r requirements.txt
streamlit run cyberzero_app.py
```
Open `http://localhost:8501` in your browser.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `cyberzero`:
1. Document changes in the **Key Architectural Decisions & Change History** table.
2. If new curriculum modules or labs are added, update `engine/curriculum.py` and register corresponding UI views in `web/` and `cli/`.
3. Ensure all new interactive labs remain isolated within `engine/simulators.py`.
