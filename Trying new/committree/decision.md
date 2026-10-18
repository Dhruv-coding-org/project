# Decision Record & Architecture Guide: CommitTree

## 1. Overview & Purpose
**CommitTree** is an interactive, gamified Git learning and simulation studio built in React and TypeScript. It replaces dry CLI tutorials with dynamic, real-time SVG graph visualizers, an in-memory Git state engine, a terminal emulator, step-by-step challenges, and simulated developer workflows (merge conflicts, interactive rebase, pull requests, reflog recovery, and boss battles).

---

## 2. Architecture & Component Guide

### 2.1 Core Git Engine (`src/git/`)
- **[gitEngine.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/git/gitEngine.ts)**:
  - Custom TypeScript implementation of Git repository internals without needing a backend.
  - Maintains `commits`, `branches`, `tags`, `HEAD`, `stagingArea`, and `stashStack`.
  - Implements authentic Git mechanics:
    - **Branching & Checkout**: Supports fast checkout, detached HEAD states, and `-b` flag.
    - **Merging**: Detects Fast-Forward vs 3-Way LCA (Lowest Common Ancestor) merge commits.
    - **Rebase**: Re-applies commit series onto destination branches with rewritten hashes.
    - **Reset**: Implements `--soft`, `--mixed`, and `--hard` pointer rollbacks.
    - **Cherry-Pick & Revert**: Selective commit duplication and inverse commits.
- **[challenges.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/git/challenges.ts)**: Contains categorized curriculum levels (Beginner, Intermediate, Advanced) and state verification checkers to test user completion.
- **[simulatedRepo.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/git/simulatedRepo.ts)**: Prepares initial repo states for sandbox experiments and level resets.

### 2.2 Visualizers & UI Components (`src/components/`)
- **[GitGraph.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/GitGraph.tsx)**: Dynamic SVG renderer with automatic node layout algorithms, Bezier curve parent-child connectors, active branch badges, and animated commit insertions.
- **[Terminal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/Terminal.tsx)**: Emulated command-line shell with auto-completion, argument validation, command history navigation (Up/Down arrows), and colored output.
- **[ChallengeBox.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/ChallengeBox.tsx)**: Displays current objectives, hints, expected tree visualizations, and instant victory verification.
- **[NodeInspector.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/NodeInspector.tsx)**: Detail inspector showing commit author, hash, commit message, parent list, and touched files.
- **[InteractiveRebaseModal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/InteractiveRebaseModal.tsx)**: Drag-and-drop rebase organizer to pick, squash, reword, or drop commits visually.
- **[ConflictResolverModal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/ConflictResolverModal.tsx)**: 3-way conflict editor displaying `<<<<<<< HEAD`, `=======`, and `>>>>>>> branch`.
- **[GitBisectModal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/GitBisectModal.tsx)**: Interactive binary search debugger to locate faulty commits.
- **[ReflogModal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/ReflogModal.tsx)**: Inspection tool for recovering orphaned commits and undone checkouts.
- **[BossBattles.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/BossBattles.tsx)** & **[SpeedrunArena.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/SpeedrunArena.tsx)**: Gamified crisis modes with countdown timers and combo multipliers.
- **[LevelStudio.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/components/LevelStudio.tsx)**: Custom level maker allowing users and educators to create, test, and share challenges.

### 2.3 Audio & Utilities (`src/utils/`, `src/store/`)
- **[soundEngine.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/utils/soundEngine.ts)**: Web Audio API procedural sound synthesizer (keyboard clicks, commit swooshes, success fanfares, warning alerts) without relying on heavy external audio assets.
- **[profileStore.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/store/profileStore.ts)**: LocalStorage-backed state storing user level progress, XP, unlocked themes, and speedrun records.
- **[urlSharing.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/committree/src/utils/urlSharing.ts)**: Encodes full Git repository state into URL hashes for zero-backend sharing.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `a56a32e` | Project initialization | Selected React + Vite + TypeScript for instant dev feedback and typed state modeling. |
| `dd25319` - `f74f1f2` (v2) | In-memory Git Engine & SVG Graph | Built client-side Git virtual state machine so users could execute commands without needing real git binaries or backend servers. |
| `6e6bbc4` - `b6e8fa0` (v5) | Gamification, Boss Battles & Modals | Added Interactive Rebase, Conflict Resolver, Reflog, Bisect, CI Pipeline, Speedrun Arena, and Web Audio sound synthesizer. |
| `c12f779` | UI refinement and bug fixes | Polished visual layout, keyboard shortcuts, and responsive breakpoints. |

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
