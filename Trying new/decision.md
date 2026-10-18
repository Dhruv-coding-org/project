# Decision Record & Project Directory: Trying New (Innovations Hub)

## 1. Overview & Purpose
The `Trying new` folder serves as the central innovation workspace and experimental incubator. It contains multiple independent, full-stack applications across diverse domains: interactive developer tooling, cybersecurity gamification, academic AI assistants, social automation, synchronized multimedia streaming, and automated content video generation.

---

## 2. Sub-Project Directory Index

| Subfolder | Technology Stack | Primary Domain & Features | Decision Record |
| :--- | :--- | :--- | :--- |
| **`committree/`** | React, TypeScript, Vite, Canvas/SVG | Gamified Git learning platform with interactive commit graph visualizer, terminal emulator, boss battles, and level studio. | [committree/decision.md](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/decision.md) |
| **`cyberzero/`** | Python, Streamlit, Rich CLI | Beginner cybersecurity academy with 22 structured modules, CyBot AI guide, interactive labs, and boss challenges. | [cyberzero/decision.md](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/cyberzero/decision.md) |
| **`exam-assistant/`** | Node.js, Express, Ollama/Gemini, Vanilla JS | Academic exam intelligence platform ("ExamLens") matching syllabi to historical PYQs with examiner marking rubrics. | [exam-assistant/decision.md](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/exam-assistant/decision.md) |
| **`socialflow/`** | Next.js 14, React, Google APIs, Meta Graph API | Cross-platform social media auto-publishing and scheduling engine for YouTube and Instagram with OAuth flows. | [socialflow/decision.md](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/decision.md) |
| **`syncstream/`** | Electron, React, Socket.IO, WebRTC, Node.js | Desktop & Web watch-party app providing synchronized video playback, live chat, audio calls, and custom streaming sources. | [syncstream/decision.md](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/decision.md) |
| **`would_you_rather_generator/`** | Python, MoviePy, Edge-TTS, Pillow | Automated short-form video generator creating "Would You Rather" viral videos with neural voiceover and sound effects. | [would_you_rather_generator/decision.md](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/would_you_rather_generator/decision.md) |

---

## 3. Global Architecture Principles for `Trying new`
1. **Self-Contained Dependencies**: Each subfolder maintains its own `package.json` or `requirements.txt` / virtual environment. Dependencies are strictly isolated to avoid cross-project conflicts.
2. **Dedicated `decision.md` Tracking**: Every subfolder contains a local `decision.md` that documents changes, component designs, and feature usage instructions.
3. **No Direct Root Leakage**: Assets, temporary media, models, and build artifacts should remain inside each respective subfolder.

---

## 4. Maintenance & Future Update Protocol
Whenever a new subfolder is added to `Trying new` or existing projects undergo major restructuring:
1. Register the new subfolder in the **Sub-Project Directory Index** above.
2. Create and maintain the new project's dedicated `decision.md` file following standard structure.
