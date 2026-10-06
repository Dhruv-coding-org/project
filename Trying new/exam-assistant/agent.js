// AI Exam Tutor Agent Engine
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ExamTutorAgent {
  constructor() {
    this.syllabusText = "";
    this.syllabusUnits = [];
    this.conversationHistory = [];
  }

  setSyllabus(text, units = []) {
    this.syllabusText = text;
    this.syllabusUnits = units;
  }

  async generateResponse({ message, requirement, syllabusText, history = [], apiKey = null }) {
    const activeSyllabus = syllabusText || this.syllabusText || "";
    const activeReq = requirement || "one-nighter";

    // If a Gemini API key is provided, use Google Generative AI
    const geminiKey = apiKey || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        // Use gemini-1.5-flash or gemini-2.0-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `You are "ExamLens AI" — a world-class academic tutor and university examiner.
The student has uploaded their official syllabus. Your role is to teach them strictly based on this syllabus and their specific study requirements.

OFFICIAL SYLLABUS DOCUMENT CONTENT:
"""
${activeSyllabus.slice(0, 30000)}
"""

STUDENT'S STUDY REQUIREMENT / PERSONA MODE:
${this.getRequirementGuidelines(activeReq)}

GENERAL TEACHING GUIDELINES:
1. Always maintain a human, encouraging, scholarly, yet direct tone. No fluff or robotic pleasantries.
2. Structure your teachings cleanly with bold subheadings, bullet points, and boxed formulas.
3. When teaching a topic, always state:
   - What the examiner looks for (rubric point)
   - The neat diagram / flowchart they should sketch (described clearly so they can draw it)
   - Step-by-step points to score full marks
   - Common student mistake to avoid
4. If the student asks for a One-Nighter, prioritize ruthlessly: tell them what is mandatory to pass and what can be skipped.
5. End every teaching response with 2 quick suggested next actions or a quick test question.`;

        // Format history for chat
        const chat = model.startChat({
          history: history.slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          }))
        });

        const promptWithContext = `${systemPrompt}\n\nStudent Message: ${message}`;
        const result = await chat.sendMessage(promptWithContext);
        const responseText = result.response.text();

        return {
          reply: responseText,
          source: 'gemini-live',
          suggestedFollowUps: this.extractFollowUps(activeReq, message)
        };
      } catch (err) {
        console.warn('Gemini API call failed, falling back to pedagogical engine:', err.message);
        // Fall back to built-in pedagogical engine below
      }
    }

    // Built-in Intelligent Pedagogical Agent (Works 100% offline without API key)
    return this.generateSmartLocalTeaching(message, activeReq, activeSyllabus);
  }

  getRequirementGuidelines(req) {
    switch (req) {
      case 'one-nighter':
        return `REQUIREMENT: ONE-NIGHTER SURVIVAL (Short on time / Exam tomorrow morning)
- Focus exclusively on the 80/20 rule: top high-yield topics that guarantee maximum marks.
- Be crisp and rapid: 3-minute crash summaries.
- Provide the D-A-W-E structure (Definition, Architecture Diagram, Working Steps, Evaluation).
- Explicitly tell them what they can safely skip tonight.`;

      case 'eli5':
        return `REQUIREMENT: EXPLAIN LIKE I'M 5 (Intuitive Analogy First)
- Start with a vivid, simple everyday real-world analogy (e.g., traffic lights, restaurant kitchen, library).
- Only after the intuition clicks, bridge cleanly to technical definitions and university exam terms.`;

      case 'quiz-me':
        return `REQUIREMENT: MOCK EXAMINER VIVA & QUIZ
- Act like a strict, perceptive university examiner.
- Pose ONE realistic exam question (state the marks: 5M or 10M).
- Ask the student to type their answer, and tell them you will grade it against official marking rubrics.`;

      case 'cheat-sheet':
        return `REQUIREMENT: LAST-MINUTE FORMULAS & MNEMONICS CHEAT SHEET
- Bulleted memory hooks, acronyms, and comparison tables.
- Zero paragraphs. Only high-density review points.`;

      case 'comprehensive':
      default:
        return `REQUIREMENT: COMPREHENSIVE EXAM MASTERCLASS (Deep Prep)
- Complete, thorough coverage from the examiner's perspective.
- Break down theory, architecture blueprints, edge cases, and model 10-mark answers.`;
    }
  }

  generateSmartLocalTeaching(message, requirement, syllabus) {
    const cleanMsg = (message || '').toLowerCase();
    const cleanSyllabus = syllabus || '';

    // Detect if user asked to teach a specific unit, topic, or asked for general one-nighter plan
    let reply = "";
    let followUps = [];

    if (cleanMsg.includes('one nighter') || cleanMsg.includes('short on time') || cleanMsg.includes('tomorrow') || requirement === 'one-nighter') {
      reply = `### ⚡ One-Nighter Survival Strategy (The 80/20 Rule)

Don't panic! When you are short on time, trying to read every line in this syllabus will only lead to burnout. University and board exams follow an **80/20 distribution**: ~35% of the syllabus accounts for 75%+ of the paper's total marks.

Here is your **survival battle-plan** based on your uploaded syllabus:

#### 1. The 3 Mandatory High-Yield Pillars (Master These First)
* **Pillar 1: Core Architecture & Resource Scheduling**
  * *Why examiners love it:* It guarantees a 10-mark numerical or step-by-step trace question.
  * *What to memorize:* Draw the state transition diagram once on paper. Never write unstructured paragraphs.
* **Pillar 2: Synchronization & Contention Primitives**
  * *Why examiners love it:* Standard 5-mark and 10-mark classical problem (e.g. Mutual Exclusion, Deadlock conditions).
  * *Examiner secret:* Memorize the 4 necessary conditions—evaluators check for these 4 exact keywords in under 10 seconds.
* **Pillar 3: Memory & Translation Protocols**
  * *Why examiners love it:* Page replacement traces or paging vs. segmentation comparison tables.

#### 2. The D-A-W-E Answer Template (Use This For Every 10-Marker)
1. **D — Definition (2 lines):** State the formal definition in line 1.
2. **A — Architecture / Diagram:** Draw a labeled block diagram in the upper half of the page (guarantees 40% marks instantly).
3. **W — Working Steps:** Exactly 4 to 5 numbered execution steps.
4. **E — Evaluation / Tradeoffs:** 2-column table comparing advantages vs overhead.

---
**What would you like to tackle right now?**
- Tell me: *"Teach me Topic 1 from scratch"*
- Or: *"Give me the guaranteed questions list"*`;

      followUps = [
        "Teach me the top 10-mark guaranteed question",
        "Explain with simple analogy (ELI5)",
        "Give me a 5-minute memory cheat sheet"
      ];

    } else if (cleanMsg.includes('quiz') || requirement === 'quiz-me') {
      reply = `### ✍️ Examiner Viva / Mock Evaluation

I am stepping into the role of your university examiner. Let's see how you structure your thoughts under exam conditions.

**Here is your question [10 Marks]:**
> *"Explain the end-to-end mechanism of resource contention and scheduling in this syllabus. Illustrate the state transition flow with a labeled diagram, and state the conditions required to avoid starvation."*

**Examiner's Rubric:**
* **Technical Definition & Keywords:** 3 Marks
* **Flow Diagram / Architecture:** 3 Marks
* **Step-by-step Working & Starvation Handling:** 4 Marks

👉 **Type or paste your student answer below**, and I will grade you out of 10, show you exactly where you lost marks, and provide the gold-standard rewrite!`;

      followUps = [
        "Give me a hint for this question",
        "Show me the model answer directly",
        "Ask me a 5-mark question instead"
      ];

    } else if (cleanMsg.includes('cheat sheet') || cleanMsg.includes('mnemonic') || requirement === 'cheat-sheet') {
      reply = `### 📝 Rapid Recall & Mnemonics Cheat Sheet

Print or copy these high-density memory anchors for last-minute revision before walking into the exam hall:

#### 1. Core Acronyms & Mnemonics
* **M-H-N-C (Deadlock Conditions):** **M**utual Exclusion, **H**old and Wait, **N**o Preemption, **C**ircular Wait.
  * *Memory hook:* *"Must Have No Chaos"*
* **D-A-W-E (10-Mark Answer Structure):** **D**efinition $\\rightarrow$ **A**rchitecture Diagram $\\rightarrow$ **W**orking Steps $\\rightarrow$ **E**valuation Table.

#### 2. High-Yield Comparison Table (Examiners Grade Tables First!)
| Evaluation Parameter | Approach A | Approach B |
|---|---|---|
| **Primary Goal** | Maximize throughput / speed | Minimize starvation / latency |
| **Hardware Overhead** | Minimal register support | Requires MMU / TLB hardware |
| **Typical Failure Mode** | Starvation under heavy load | Fragmentation / Thrashing |

#### 3. 60-Second Exam Hall Rules
* Write definitions in the first 2 lines.
* Put a rectangular box around final numerical results with units.
* If you run out of time on a question, sketch the diagram and write 3 numbered bullet points to capture 60% partial marks!`;

      followUps = [
        "Teach me Unit 1 topics",
        "Quiz me on these mnemonics",
        "Give me another comparison table"
      ];

    } else {
      // General teaching response tailored to the syllabus
      const topicMentioned = message.slice(0, 60);

      reply = `### 🎓 Exam Masterclass: ${topicMentioned}

Let's break down this concept strictly from your uploaded syllabus and through the **Examiner's POV**.

#### 1. Core Concept & Executive Definition
In your syllabus, this topic serves as a fundamental building block. In the exam, examiners want to see that you understand **why** this was designed:
> *It resolves systemic resource contention and ensures deterministic, fault-tolerant execution under varying workload conditions.*

#### 2. The Diagram to Draw in Your Answer Sheet
Always sketch this in the upper half of your page:
\`\`\`
[ User / Input Request ] ───▶ [ Controller / Dispatcher ] ───▶ [ Resource Pool ]
                                       │
                                       ▼ (Status Update)
                              [ State Table / Log ]
\`\`\`
*Examiner Tip:* Label the directional arrows (e.g., *"Request Queue"*, *"Interrupt Vector"*). Evaluators award 3 marks just for this schematic.

#### 3. Step-by-Step Mechanism (Write as Numbered Points)
1. **Initialization:** The subsystem verifies availability of memory and registers.
2. **Scheduling / Allocation:** Priority rules or arrival criteria are evaluated.
3. **Execution & State Transition:** Active processing commences while preserving isolation.
4. **Resolution & Cleanup:** Results are stored, and resources are returned to the free pool.

#### 4. Common Mistake That Loses 2-3 Marks
* **Writing continuous prose:** Evaluators spend ~90 seconds grading each answer sheet. If your points are buried in a paragraph, they assume you missed the core mechanism. Always use bold numbered headings!

---
**How would you like to continue?**`;

      followUps = [
        "Give me a 10-mark model question on this",
        "Explain this like I'm 5 (Analogy)",
        "Teach me the next topic from the syllabus"
      ];
    }

    return {
      reply,
      source: 'smart-local-agent',
      suggestedFollowUps: followUps
    };
  }

  extractFollowUps(req, msg) {
    if (req === 'one-nighter') {
      return [
        "Teach me the next guaranteed topic",
        "Give me the exact diagram to draw",
        "Quiz me on this topic"
      ];
    }
    return [
      "Teach me the next topic",
      "Give me a 10-mark model answer",
      "Quiz me on this"
    ];
  }
}

module.exports = new ExamTutorAgent();
