# Decision Record & Architecture Guide: ExamLens (Exam Assistant)

## 1. Overview & Purpose
**ExamLens** is an academic study intelligence platform designed to help students prepare for university and board examinations through the evaluator's point of view. By cross-analyzing course syllabi against Historical Previous Year Questions (PYQs), it calculates the Pareto 80/20 distribution—identifying the ~35% of syllabus topics that historically generate ~75%+ of total exam marks.

---

## 2. Architecture & Component Guide

### 2.1 Backend Server (`server.js`)
- **[server.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/exam-assistant/server.js)**:
  - Express.js application serving static front-end assets and REST endpoints.
  - Built-in automatic port collision handling (falls back to alternate ports if default `3000` is busy).
  - Unhandled exception and rejection traps to ensure resilient local uptime.
  - Ingestion pipeline for both `.docx` (via `mammoth`) and `.pdf` documents via `multer`.

### 2.2 Analytical & AI Engines (`engine.js`, `agent.js`)
- **[engine.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/exam-assistant/engine.js)**:
  - **Pareto 80/20 Calculator**: Ranks syllabus units and topics by historical mark weight and appearance frequency.
  - **Predicted Question Paper Generator**: Synthesizes realistic 3-tier mock papers (Section A: 2 marks short answers; Section B: 5 marks conceptual; Section C: 10 marks deep-dive problems) using cycle recurrence heuristics.
  - **Answer Rubric Evaluator**: Breaks grading into Technical Keywords (40%), Structure & Diagrams (30%), and Completeness (30%).
- **[agent.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/exam-assistant/agent.js)**:
  - **Dual AI Engine**: Primary integration with local PC LLMs via **Ollama** (defaulting to lightweight `llama3.2:1b`), with seamless automatic fallback to **Google Gemini**.
  - **IPv6 Hang Safeguard**: Uses strict IPv4 `http://127.0.0.1:11434` to prevent Windows localhost resolution delays.
  - **Non-blocking Probe**: Pings AI health in the background without freezing the client UI.

### 2.3 Frontend & Design System (`public/`)
- **Aesthetic Philosophy**: Styled like a scholarly academic reference desk—warm parchment ivory (`#F8F6F1`), dark carbon ink typography (`Lora` serif and `Plus Jakarta Sans`), and subtle terracotta accents (`#BF4C28`). Strictly avoids generic glowing neon AI tropes.
- **[public/index.html](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/exam-assistant/public/index.html)**:
  - **Priority Heatmap**: High-yield vs low-yield topic visualization.
  - **One-Nighter Cram Mode**: High-speed survival mode with 3-minute bullet summaries and mandatory diagrams.
  - **Topic Masterclass**: Detailed rubric view and common exam pitfalls.
  - **AI Examiner Grader**: Student answer submission with mark deduction explanations.
  - **Interactive AI Tutor Chat**: Conversational study mentor aware of syllabus constraints.
  - **Upload Studio**: Drag-and-drop document parser for custom course materials.
- **[public/js/app.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/exam-assistant/public/js/app.js)**: Client-side state manager and API bridge.

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
