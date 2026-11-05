# Decision Record & Architecture Guide: CommitTree

## 1. Overview & Purpose
**CommitTree** is an interactive, gamified Git learning and simulation studio built in React and TypeScript. It replaces dry CLI tutorials with dynamic, real-time SVG graph visualizers, an in-memory Git state engine, a terminal emulator, step-by-step challenges, and simulated developer workflows (merge conflicts, interactive rebase, pull requests, reflog recovery, and boss battles).

---

## 2. Architecture & Component Guide

### 2.1 Visual Identity & Design System Alignment (`.agents/design.md`)
The interface was overhauled to adhere to the Developer Workbench theme codified in `../../.agents/design.md`:
- **5-Color Workbench Palette**:
  - Base Background: Deep charcoal workbench (`#161514`)
  - Elevated Container: Slate graphite (`#1E1D1B`)
  - Border / Muted Stroke: Crisp charcoal contour (`#262422`)
  - Typography / High Contrast Text: Warm paper white (`#EDEAE4`)
  - Focused Accent: Terracotta branch orange (`#D45B36`)
- **Typography & Font Stack**:
  - Replaced generic `Inter` and system fonts with high-legibility `Plus Jakarta Sans` for interface controls and `JetBrains Mono` for terminal commands and code blocks.
  - Scale adheres strictly to the Major Third ($1.250$) proportional progression.
- **Anti-Template Enforcement**:
  - Completely stripped floating ambient neon glow mesh spheres, rainbow gradient text, glowing card borders, and artificial glassmorphism backdrop filters.
  - Replaced all emojis in navigation buttons, stats bars, action tabs, challenge victory badges, and terminal titles with lightweight semantic SVGs.
  - Responsive mobile tab switcher ensuring smooth layout degradation below $850\text{px}$ with accessible $\ge 44\text{px}$ touch targets.

### 2.2 Core Git Engine (`src/git/`)
- **[gitEngine.ts](./src/git/gitEngine.ts)**:
  - Custom TypeScript implementation of Git repository internals without needing a backend.
  - Maintains `commits`, `branches`, `tags`, `HEAD`, `stagingArea`, and `stashStack`.
  - Implements authentic Git mechanics:
    - **Branching & Checkout**: Supports fast checkout, detached HEAD states, and `-b` flag.
    - **Merging**: Detects Fast-Forward vs 3-Way LCA (Lowest Common Ancestor) merge commits.
    - **Rebase**: Re-applies commit series onto destination branches with rewritten hashes.
    - **Reset**: Implements `--soft`, `--mixed`, and `--hard` pointer rollbacks.
    - **Cherry-Pick & Revert**: Selective commit duplication and inverse commits.
- **[challenges.ts](./src/git/challenges.ts)**: Contains categorized curriculum levels (Beginner, Intermediate, Advanced) and state verification checkers to test user completion.
- **[simulatedRepo.ts](./src/git/simulatedRepo.ts)**: Prepares initial repo states for sandbox experiments and level resets.

### 2.3 Visualizers & UI Components (`src/components/`)
- **[GitGraph.tsx](./src/components/GitGraph.tsx)**: Dynamic SVG renderer with automatic node layout algorithms, Bezier curve parent-child connectors, active branch badges, and animated commit insertions.
- **[Terminal.tsx](./src/components/Terminal.tsx)**: Emulated command-line shell with auto-completion, argument validation, command history navigation (Up/Down arrows), and colored output.
- **[ChallengeBox.tsx](./src/components/ChallengeBox.tsx)**: Displays current objectives, hints, expected tree visualizations, and instant victory verification.
- **[NodeInspector.tsx](./src/components/NodeInspector.tsx)**: Detail inspector showing commit author, hash, commit message, parent list, and touched files.
- **[InteractiveRebaseModal.tsx](./src/components/InteractiveRebaseModal.tsx)**: Drag-and-drop rebase organizer to pick, squash, reword, or drop commits visually.
- **[ConflictResolverModal.tsx](./src/components/ConflictResolverModal.tsx)**: 3-way conflict editor displaying `<<<<<<< HEAD`, `=======`, and `>>>>>>> branch`.
- **[GitBisectModal.tsx](./src/components/GitBisectModal.tsx)**: Interactive binary search debugger to locate faulty commits.
- **[ReflogModal.tsx](./src/components/ReflogModal.tsx)**: Inspection tool for recovering orphaned commits and undone checkouts.
- **[BossBattles.tsx](./src/components/BossBattles.tsx)** & **[SpeedrunArena.tsx](./src/components/SpeedrunArena.tsx)**: Gamified crisis modes with countdown timers and combo multipliers.
- **[LevelStudio.tsx](./src/components/LevelStudio.tsx)**: Custom level maker allowing users and educators to create, test, and share challenges.

### 2.4 Audio & Utilities (`src/utils/`, `src/store/`)
- **[soundEngine.ts](./src/utils/soundEngine.ts)**: Web Audio API procedural sound synthesizer (keyboard clicks, commit swooshes, success fanfares, warning alerts) without relying on heavy external audio assets.
- **[profileStore.ts](./src/store/profileStore.ts)**: LocalStorage-backed state storing user level progress, XP, unlocked themes, and speedrun records.
- **[urlSharing.ts](./src/utils/urlSharing.ts)**: Encodes full Git repository state into URL hashes for zero-backend sharing.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `a56a32e` | Project initialization | Selected React + Vite + TypeScript for instant dev feedback and typed state modeling. |
| `dd25319` - `f74f1f2` (v2) | In-memory Git Engine & SVG Graph | Built client-side Git virtual state machine so users could execute commands without needing real git binaries or backend servers. |
| `6e6bbc4` - `b6e8fa0` (v5) | Gamification, Boss Battles & Modals | Added Interactive Rebase, Conflict Resolver, Reflog, Bisect, CI Pipeline, Speedrun Arena, and Web Audio sound synthesizer. |
| `c12f779` | UI refinement and bug fixes | Polished visual layout, keyboard shortcuts, and responsive breakpoints. |
| `audit-fix` | Build restoration & tracking recovery | Restored missing `package.json` and `index.html` allowing `npm run build` and `npm run dev` to execute cleanly in 336ms; restored Git tracking by removing blanket ignore in root `.gitignore`. |
| `privacy-cleanup` | Anonymized demo persona & cleaned draft plans | Generalized simulated demo user to Anonymous (`dev@committree.git`), deleted obsolete `implementation_plan.md`, and sanitized documentation links. |
| `lint-type-fix` | Resolved 14 ESLint issues & strict typing | Fixed impure `Date.now()` render call in `LevelStudio`, typed `customChallenge` and `interval` eliminating all `any` usages, removed unused error variables, scoped `BOSS_BATTLES` export to fix Fast Refresh, and configured ESLint rules for 0-warning build. |
| `design-system-audit` | Anti-template overhaul & design system token adoption | Replaced generic Inter font with `Plus Jakarta Sans` / `JetBrains Mono`; removed floating glow mesh spheres, neon gradients, and glassmorphism; replaced UI emojis with curated SVG icons; implemented 5-color workbench dark palette (`#161514`, `#1E1D1B`, `#262422`, `#EDEAE4`, `#D45B36`) complying with `.agents/design.md`. |

---

## 4. Usage & Running Instructions

### Local Development
1. Install dependencies:
   ```bash
   cd "Trying new/committree"
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `committree`:
1. Document changes in the **Key Architectural Decisions & Change History** table.
2. If new Git commands are implemented, update `src/git/gitEngine.ts` and describe their syntax in `Terminal.tsx` and this document.
3. If new level types or game modes are created, document them in Section 2.
