# Implementation Plan - CommitTree Git Simulator

CommitTree is a premium, highly interactive web application designed to help developers visualize Git commands in real-time. It features a custom-built Git engine running in TypeScript, an SVG-based dynamic commit graph visualizer, an interactive terminal that parses actual Git commands, and a level-based challenge suite to teach advanced branching strategies.

## User Review Required

> [!NOTE]
> **Tech Stack Selection**: We will initialize this project using **Vite + React + TypeScript** (`react-ts` template) in a new folder named `committree` adjacent to `socialflow` in your workspace. This ensures a lightning-fast build time, completely separate dependencies, and a clean single-page app architecture.

## Proposed Changes

We will create a new directory structure under `committree`:
```
committree/
├── src/
│   ├── git/
│   │   ├── gitEngine.ts      # Core Git state machine and commands (commit, checkout, merge, rebase, reset, etc.)
│   │   └── challenges.ts     # Level data, instructions, and target state checkers
│   ├── components/
│   │   ├── GitGraph.tsx      # SVG commit graph rendering with auto-layout
│   │   ├── Terminal.tsx      # Interactive CLI emulator with autocomplete and history
│   │   ├── ChallengeBox.tsx  # Game guide, objectives, hints, and progress tracker
│   │   └── NodeInspector.tsx # Detail card for inspected commits and branches
│   ├── App.tsx               # Main layout (Split-screen: Graph left, panels right)
│   ├── App.css               # Premium dark/cyberpunk layout styles
│   ├── index.css             # Base CSS variables, scrollbars, and global styling tokens
│   └── main.tsx              # React mounting entry point
```

---

### Component Specifications

#### 1. Core Git Engine (`src/git/gitEngine.ts`) [NEW]
A robust TypeScript model representing a repository state:
*   **Data Models**:
    *   `Commit`: `{ hash: string; parents: string[]; message: string; branch: string; isMerge: boolean; }`
    *   `Branch`: `{ name: string; targetHash: string; }`
    *   `GitState`: `{ commits: Map<string, Commit>; branches: Map<string, Branch>; activeBranch: string | null; headCommitHash: string; }`
*   **Git Command Implementations**:
    *   `commit(msg)`: Appends a commit node. If on a branch, advances the branch pointer; if detached, moves `HEAD` only.
    *   `checkout(target)`: Supports switching to branches or detaching `HEAD` to individual commit hashes. Handles `checkout -b <name>`.
    *   `branch(name)`: Creates a pointer pointing to current `HEAD` commit.
    *   `merge(targetBranch)`:
        *   *Fast-forward*: Moves active branch pointer directly to the target's commit if current HEAD is an ancestor.
        *   *3-Way Merge*: Finds the Least Common Ancestor (LCA) and creates a merge commit with two parents.
    *   `rebase(targetBranch)`: Re-applies local commits starting from the fork point on top of the target branch, re-linking parent pointers.
    *   `cherryPick(hash)`: Copies the target commit and applies it as a new commit on top of `HEAD`.
    *   `reset(hash, mode)`: Soft/hard resets to set current HEAD branch pointer.

#### 2. Git Graph Visualizer (`src/components/GitGraph.tsx`) [NEW]
An SVG-based interactive canvas that automatically maps branch commits to lanes:
*   **Layout Algorithm**:
    *   Allocates a unique X-coordinate (track/lane) for each active branch.
    *   Allocates Y-coordinates chronologically (older commits at the bottom, newer commits at the top, or top-to-bottom scrolling).
    *   Calculates SVG Bezier curves (`d="M x1 y1 C ... x2 y2"`) to draw connections between parent and child commits.
*   **Interactivity**:
    *   Clicking a commit node highlights it, displays details, and triggers parent-link highlights.
    *   Hovering nodes shows mini diff descriptions (e.g., mock file names changed).
    *   Dynamic pulsing animations on the current `HEAD` node.

#### 3. Interactive Terminal (`src/components/Terminal.tsx`) [NEW]
A terminal command panel that simulates real Git CLI usage:
*   **Features**:
    *   Full prompt parsing (regex checking for `git checkout`, `git branch`, etc.).
    *   Command history navigation using **Up / Down** arrow keys.
    *   **Tab-Completion** for branches, commands, and options.
    *   Visual error feedbacks (red warning lines) and successful feedback summaries matching real git outputs.

#### 4. Challenge System & Game Loop (`src/git/challenges.ts`) [NEW]
*   **Campaign Structure**:
    *   **Level 1**: Commit Basics (`git commit -m "..."`)
    *   **Level 2**: Branching Off (`git branch`, `git checkout`)
    *   **Level 3**: The Merge (`git merge`)
    *   **Level 4**: Rebasing History (`git rebase`)
    *   **Level 5**: Cherry-Picking Hotfixes (`git cherry-pick`)
    *   **Level 6**: Time Travel (`git reset`, detached HEAD)
*   **Validation Rules**: A validator function checks if the user's `GitState` matches the goal conditions (e.g., "Branch `feature` has been merged into `main`", "HEAD is detached and pointing to hash `x`").

---

## Verification Plan

### Automated & Unit Tests
We will verify command actions and tree layout computations by:
*   Running unit checks on the parsed Git commands within `gitEngine.ts` to ensure edge-cases (like merging a branch that is already merged, rebasing onto yourself, or checkout on non-existent branches) fail gracefully and return descriptive error messages.

### Manual Verification
1.  Launch the Vite dev server (`npm run dev`).
2.  Open the CommitTree browser tab.
3.  Go to Sandbox mode and run a sequence of commands:
    *   `git commit -m "c1"`
    *   `git branch feature`
    *   `git checkout feature`
    *   `git commit -m "c2"`
    *   `git checkout main`
    *   `git merge feature`
4.  Confirm the SVG graph draws correct nodes, connects lines properly, displays branch labels, and visualizes the merge commit correctly.
5.  Complete Levels 1 to 6 in Campaign mode and verify the completion state fires particle/celebration effects and opens the next level.
