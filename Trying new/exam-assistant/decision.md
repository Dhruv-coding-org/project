# Decision Record & Architecture Guide: ExamLens (Exam Assistant)

## 1. Overview & Purpose
**ExamLens** is an academic study intelligence platform designed to help students prepare for university and board examinations through the evaluator's point of view. By cross-analyzing course syllabi against Historical Previous Year Questions (PYQs), it calculates the Pareto 80/20 distribution—identifying the ~35% of syllabus topics that historically generate ~75%+ of total exam marks.

---

## 2. Architecture & Component Guide

### 2.1 Backend Server (`server.js`)
- **[server.js](./server.js)**:
  - Express.js application serving static front-end assets and REST endpoints.
  - Built-in automatic port collision handling (falls back to alternate ports if default `3000` is busy).
  - Unhandled exception and rejection traps to ensure resilient local uptime.
  - Ingestion pipeline for both `.docx` (via `mammoth`) and `.pdf` documents via `multer`.

### 2.2 Analytical & AI Engines (`engine.js`, `agent.js`)
- **[engine.js](./engine.js)**:
  - **Pareto 80/20 Calculator**: Ranks syllabus units and topics by historical mark weight and appearance frequency.
  - **Predicted Question Paper Generator**: Synthesizes realistic 3-tier mock papers (Section A: 2 marks short answers; Section B: 5 marks conceptual; Section C: 10 marks deep-dive problems) using cycle recurrence heuristics.
  - **Answer Rubric Evaluator**: Breaks grading into Technical Keywords (40%), Structure & Diagrams (30%), and Completeness (30%).
- **[agent.js](./agent.js)**:
  - **Dual AI Engine**: Primary integration with local PC LLMs via **Ollama** (defaulting to lightweight `llama3.2:1b`), with seamless automatic fallback to **Google Gemini**.
  - **IPv6 Hang Safeguard**: Uses strict IPv4 `http://127.0.0.1:11434` to prevent Windows localhost resolution delays.
  - **Non-blocking Probe**: Pings AI health in the background without freezing the client UI.

### 2.3 Frontend & Design System (`public/`)
- **Aesthetic Philosophy**: Strictly aligned with [`.agents/design.md`](../../.agents/design.md). Uses the official 5-color palette: Warm Alabaster (`#F9F8F5`), Pure Studio (`#FFFFFF`), Carbon Ink (`#1E1E1C`), Weathered Slate (`#6E6A63`), and Restrained Terracotta (`#B84A28`). Implements a Major Third (1.250) type scale with `Lora` and `Plus Jakarta Sans`, 8-step spacing scale (4px base), 3-step radius scale (4px, 8px, 14px), single ambient elevation, and zero emojis in UI controls (curated SVGs used exclusively).
- **[public/index.html](./public/index.html)**:
  - **Syllabus Ingestion**: Drag-and-drop document parser for `.docx`, `.pdf`, and `.txt` files with clean status indicators.
  - **Study Strategy Selector**: 5 focused pedagogical modes (High-Yield 80/20 Cram, Comprehensive Masterclass, Concept Analogies ELI5, Examiner Viva & Quiz, Cheat Sheet & Rubrics).
  - **Conversational Tutor Stage**: Asymmetric reading column with formatted examiner markdowns, rubric tables, and follow-up chips.
  - **Mobile Dual-Viewport Tabs**: Responsive switcher tabs (`<= 850px`) preserving 44px touch targets.
- **[public/css/styles.css](./public/css/styles.css)**: Centralized design system stylesheet implementing CSS variables for the 5-color palette, typography scale, spacing rhythm, and subtle ambient shadow.
- **[public/js/app.js](./public/js/app.js)**: Client-side state manager, Ollama/Gemini API bridge, and dynamic markdown message renderer.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `1b2c12d` | Initial launch of ExamLens | Established core academic Pareto 80/20 algorithm, dual study modes, and humanized ivory aesthetic. |
| `9de4213` | Word (`.docx`) file ingestion via Mammoth | Allowed university students to upload course syllabi and question banks directly in standard Word document format. |
| `85b37fb` | Interactive AI Tutor Agent & dynamic requirements | Added interactive conversational tutor able to answer student queries tailored to syllabus topic rubrics. |
| `1c85bac` | Local PC LLM (Ollama) & Google Gemini integration | Allowed private, offline AI inference on local machines with optional cloud Gemini scalability. |
| `8029795` | Resolved Ollama IPv6 socket hang & robust markdown | Replaced `localhost` with explicit `127.0.0.1` to bypass Windows IPv6 resolution timeouts and added robust markdown formatting. |
| `97640e4` | Local `llama3.2:1b` designated as active default AI | Configured ultra-fast, low-memory local inference suitable for average consumer laptops. |
| `7ad87d1` | Port collision detection, nodemon & process safety | Prevented EADDRINUSE crashes and simplified continuous local development. |
| `audit-fix` | Multi-session syllabus scoping, upload type checks & mobile layout | Added session map to `agent.js` preventing syllabus collisions across users; restricted upload MIME extensions (`.docx`, `.pdf`, `.txt`); created responsive mobile workspace tabs (`<= 850px`); added accessibility ARIA attributes. |
| `sec-hardening` | Added .env.example & relative path documentation | Provided environment configuration template for Gemini API key and port setup, and converted absolute URLs to relative links. |
| `design-v2` | Universal design system compliance & anti-template overhaul | Codified tokens from `/.agents/design.md`: 5-color palette (`#F9F8F5`, `#1E1E1C`, `#B84A28`), Major Third (1.250) typographic hierarchy, 8-step spacing, 3-tier radius (`sm: 4px`, `md: 8px`, `lg: 14px`), single ambient elevation, removal of escaped newline artifact in HTML, and complete replacement of all UI emojis with curated SVG icons. |

---

## 4. Usage & Running Instructions

### Local Development
1. Install dependencies:
   ```bash
   cd "Trying new/exam-assistant"
   npm install
   ```
2. (Optional) Run local AI with Ollama:
   ```bash
   ollama run llama3.2:1b
   ```
3. Start the application:
   ```bash
   npm start
   # Or for development auto-reload:
   npm run dev
   ```
4. Access via browser: `http://localhost:3000`.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `exam-assistant`:
1. Document changes in the **Key Architectural Decisions & Change History** table.
2. If prompt templates or AI model integrations change, update `agent.js` and record details in Section 2.2.
3. Preserve the ivory/carbon academic design language in `styles.css`.
