# ExamLens — Examiner POV Intelligence & One-Nighter Assistant

A humanized, editorial academic tool that cross-analyzes university / board examination syllabi against Historical Previous Year Questions (PYQs). It enables students to prepare strictly through the lens of what the evaluator awards marks for.

---

## 🌟 Philosophy & Design

* **Humanized & Scholarly Design**: No generic AI neon purples, glowing cyan grids, or vibration/pulsing gradients. ExamLens is designed like an academic reference desk—warm parchment ivory (`#F8F6F1`), rich carbon ink typography (`Lora` serif and `Plus Jakarta Sans`), subtle micro-borders, and terracotta/rust accents (`#BF4C28`).
* **Pareto 80/20 Rule**: Automatically discovers the ~35% of syllabus topics that generate 75%+ of historical exam marks.
* **Dual Study Modes**:
  * ⚡ **One-Nighter (Survival 80/20 Cram)**: Strips out low-probability fluff, gives 3-minute bullet recaps, exact diagrams to draw for easy marks, and guaranteed recurring questions.
  * 🎓 **Comprehensive Mode**: Deep dive into unit rubrics, official examiner marking schemes, and edge conditions.
* **AI Examiner & Answer Grader**: Paste your written answer to receive rubric-based step grading (Technical Keywords 40%, Structure & Diagrams 30%, Completeness 30%), pinpointing exact marks lost and providing a gold-standard rewrite.
* **Predicted Question Paper**: Synthesizes realistic mock exam papers with Section A (2 marks), Section B (5 marks), and Section C (10 marks) based on historical recurrence cycles.

---

## 🚀 Getting Started

### 1. Installation & Start
```bash
cd "Trying new/exam-assistant"
npm install
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Exploring with 1-Click Sample Datasets
* Click **"Load Operating Systems"** or **"Load DBMS"** on the banner to instantly analyze real-world end-semester exam syllabi and multi-year question papers.
* Click any topic card in the **Priority Heatmap** to open its **Topic Masterclass**.
* Toggle **⚡ One-Nighter** in the top navigation to switch the entire study system into crash-course survival mode.

### 3. Custom Uploads
* Head to the **📁 Syllabus & PYQ Studio** tab.
* Upload your syllabus PDF and past question papers PDF (or paste text directly).
* Click **Run Cross-Analysis Engine** to compute fresh priority heatmaps.
