# Decision Record & Architecture Guide: CyberZero

## 1. Overview & Purpose
**CyberZero** is an interactive, gamified cybersecurity learning platform created for absolute beginners with zero coding experience. It uses intuitive everyday analogies (club bouncers, secret locked briefcases, Trojan horse statues, and naive security guards) to demystify computer networks, cryptography, web vulnerabilities, and defensive operations.

---

## 2. Architecture & Component Guide

### 2.1 Dual-Interface Architecture
CyberZero is designed with a dual-interface model that shares a single unified state file (`profile.json`):
1. **Interactive Terminal RPG (`cyberzero_cli.py`)**: A command-line game built with Python's `rich` library for an authentic hacker terminal experience.
2. **Visual Command Center (`cyberzero_app.py`)**: A Streamlit web dashboard with interactive sliders, charts, phishing email inspection, and visual trophy cabinets.

### 2.2 Engine Modules (`engine/`)
- **[curriculum.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/cyberzero/engine/curriculum.py)**:
  Contains the 22-module structured curriculum split across 5 progressive phases:
  - *Phase 1: Foundation & The Digital World* (IP addresses, packets, DNS, ports).
  - *Phase 2: Personal Protection & Identity* (passwords, MFA, social engineering).
  - *Phase 3: Digital Contagions & Malware* (viruses, trojans, ransomware, worms).
  - *Phase 4: Web & Network Security* (HTTPS, certificates, firewalls, XSS, SQLi).
  - *Phase 5: Advanced Defense & Cryptography* (symmetric/asymmetric encryption, hashing, incident response).
- **[simulators.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/cyberzero/engine/simulators.py)**: Safe in-memory simulated environments for hands-on labs (password cracking time estimator, phishing header inspector, Caesar cipher / SHA-256 playground).
- **[boss_engine.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/cyberzero/engine/boss_engine.py)**: Handles culminating boss encounters testing accumulated knowledge under timed conditions.
- **[cybot.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/cyberzero/engine/cybot.py)**: AI mentor engine providing context-specific hints, ELI5 analogies, and encouragement.
- **[progress.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/cyberzero/engine/progress.py)**: State persistence manager serializing progress, XP, badges, and completed labs to `profile.json`.

### 2.3 Command Line Interface (`cli/`)
- **`commands.py`**: Command parser and handler for commands like `status`, `modules`, `lesson <N>`, `lab <N>`, `boss <N>`, `hint`, and `reset`.
- **`ui.py`**: Terminal formatting, tables, color-coded status badges, and ASCII art headers.
- **`cybot_cli.py`**: Terminal REPL interface for conversing with the CyBot assistant.

### 2.4 Web Dashboard (`web/`)
- **`tabs_phase1.py` - `tabs_phase5.py`**: Modular Streamlit components rendering lesson slides, interactive quiz widgets, and practical labs.
- **`dashboard.py`**: Overview page with radar skill charts, XP counters, and unlocked achievements.
- **`style.css`**: Dark cyberpunk theme customized for beginner clarity.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `992e7c2` | Initial conception: "Want to learn cybersecurity" | Formulated the 22-module beginner curriculum using plain English analogies instead of overwhelming technical jargon. |
| `992e7c2` | Unified dual-mode runtime (CLI + Streamlit) | Enabled users to choose between a cool terminal interface and an intuitive graphical dashboard without losing state. |
| `c12f779` | Safety checks and simulator refinement | Ensured all labs run strictly in memory without executing dangerous local system commands or opening real network ports. |

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
