import { type GitState, INITIAL_STATE, runGitCommand } from './gitEngine';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  objective: string;
  startingCommands: string[];
  startingState?: GitState;
  solutionCommands: string[];
  hint: string;
  tutorial: {
    conceptTitle: string;
    explanation: string[];
    diagram?: string;
  };
  beginnerTips: string[];
  checkWin: (state: GitState) => boolean;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: '1. Commit Basics',
    description: 'Learn how to record snapshots of your code. Committing creates a new node in the tree pointing to its parent.',
    objective: 'Create two new commits on top of the initial commit C0. You should see C1 and C2 added to the graph.',
    startingCommands: [],
    solutionCommands: [
      'git commit -m "c1"',
      'git commit -m "c2"',
    ],
    hint: 'Type "git commit -m "c1"" and then "git commit -m "c2"" in the terminal.',
    tutorial: {
      conceptTitle: 'What is a Git Commit?',
      explanation: [
        'Think of a Git commit as a permanent snapshot or checkpoint of your entire project at a specific point in time.',
        'Each commit is given a unique identifier (hash) and contains a reference to the commit that came right before it (its "parent").',
        'As you keep committing, you build a chain of snapshots—a Directed Acyclic Graph (DAG)—that lets you trace history or rewind whenever needed.',
        'In Git, there is a special pointer called HEAD which always indicates the exact commit or branch you are currently viewing and working on.'
      ],
      diagram: 'C0 (HEAD, main)  ──git commit──>  C0 ───> C1 (HEAD, main)',
    },
    beginnerTips: [
      'Always include a descriptive message with `-m "message"` explaining what changed.',
      'Use the Up arrow key in the terminal to quickly reuse your previous commands!',
      'Watch how the glowing circle (HEAD) moves forward with each commit you create.'
    ],
    checkWin: (state: GitState) => {
      const commits = state.commits;
      return (
        commits['C1'] !== undefined &&
        commits['C2'] !== undefined &&
        state.headCommitHash === 'C2' &&
        state.branches['main']?.targetHash === 'C2'
      );
    },
  },
  {
    id: 2,
    title: '2. Branching Out',
    description: 'Branches in Git are simply lightweight pointers to commits. They allow you to work on features in isolation.',
    objective: 'Create a new branch named "bugfix", check it out, and make a commit. Main should remain at C0, and bugfix should be at C1.',
    startingCommands: [],
    solutionCommands: [
      'git branch bugfix',
      'git checkout bugfix',
      'git commit -m "fix bug"',
    ],
    hint: 'Create a branch with "git branch bugfix", switch to it with "git checkout bugfix", and then make a commit using "git commit".',
    tutorial: {
      conceptTitle: 'How Git Branches Actually Work',
      explanation: [
        'Unlike other version control systems that copy entire directories, a Git branch is literally just a lightweight, movable sticky note pointing to a commit hash.',
        'When you run `git branch <name>`, Git simply creates a new label pointing to whatever commit HEAD is currently on. It does NOT switch you to that branch!',
        'To switch your active workspace to the new branch, you must run `git checkout <name>`. Notice how the HEAD pointer attaches itself to the new branch label.',
        'Once checked out, any new commit you make will advance that specific branch label forward, while other branches (like main) stay safely behind.'
      ],
      diagram: 'C0 (main, bugfix)  ──git checkout bugfix && git commit──>  C0 (main) ───> C1 (HEAD, bugfix)',
    },
    beginnerTips: [
      'Shortcut: You can create AND switch to a branch in one command using `git checkout -b <branch-name>`.',
      'If you ever get lost, look at which branch tag has the glowing HEAD badge next to it.',
      'Try typing `git status` or `git log` in the terminal to see your current branch and commit history.'
    ],
    checkWin: (state: GitState) => {
      return (
        state.branches['bugfix'] !== undefined &&
        state.activeBranch === 'bugfix' &&
        state.headCommitHash === 'C1' &&
        state.branches['main']?.targetHash === 'C0'
      );
    },
  },
  {
    id: 3,
    title: '3. Merging Paths',
    description: 'Merging joins two or more development histories together. A merge commit will be created with two parents.',
    objective: 'Merge the "feature" branch into "main". Make sure you are checked out on "main" before merging feature!',
    startingCommands: [
      'git commit -m "main 1"',
      'git checkout -b feature HEAD~1',
      'git commit -m "feature 1"',
      'git checkout main',
    ],
    solutionCommands: [
      'git merge feature',
    ],
    hint: 'Type "git merge feature" while you are on the "main" branch.',
    tutorial: {
      conceptTitle: 'The 3-Way Merge Explained',
      explanation: [
        'When two branches diverge (meaning both main and feature have new commits since they split), Git must combine their work.',
        'To merge a feature branch into main, you must first switch to the receiving branch (`git checkout main`) and then ask Git to pull in the other branch (`git merge feature`).',
        'Git looks at three commits: the tip of main, the tip of feature, and their common ancestor (where they originally split).',
        'It automatically combines the changes and creates a special node called a "Merge Commit" which uniquely has TWO parent pointers connecting both timelines!'
      ],
      diagram: 'C0 ───> C1 (main)\n └───> C2 (feature)  ──git merge feature──>  C3 (HEAD, main) [parents: C1, C2]',
    },
    beginnerTips: [
      'Golden Rule of Merging: Always `git checkout` the destination branch (e.g., main) BEFORE running `git merge <source-branch>`.',
      'Merge commits tie different branch lanes together in the visual graph with double connecting curves.',
      'In a real Git repository, if two branches edited the exact same line of code, Git will pause and ask you to resolve a "merge conflict".'
    ],
    checkWin: (state: GitState) => {
      const headCommit = state.commits[state.headCommitHash];
      return (
        state.activeBranch === 'main' &&
        headCommit !== undefined &&
        headCommit.isMerge &&
        headCommit.parents.includes('C1') &&
        headCommit.parents.includes('C2')
      );
    },
  },
  {
    id: 4,
    title: '4. Rebasing History',
    description: 'Rebasing reapplies commits from one branch on top of another branch. It linearizes your commit history.',
    objective: 'Rebase the "feature" branch onto "main". Ensure you are checked out on "feature" before rebasing!',
    startingCommands: [
      'git commit -m "main 1"',
      'git checkout -b feature HEAD~1',
      'git commit -m "feature 1"',
    ],
    solutionCommands: [
      'git rebase main',
    ],
    hint: 'Type "git rebase main" while checked out on the "feature" branch.',
    tutorial: {
      conceptTitle: 'What is Git Rebase?',
      explanation: [
        'Rebasing is an alternative to merging when you want to keep your commit history clean, straight, and linear without extra merge commits.',
        'When you run `git rebase main` while on a feature branch, Git picks up all the commits you made on feature since it split from main.',
        'It temporarily sets them aside, advances your feature branch pointer to the very tip of main, and then re-applies your commits one by one on top.',
        'Because the commits are applied in a new location with a new parent, Git generates NEW commit hashes for them (indicated by a prime symbol like C2\' in our simulator).'
      ],
      diagram: 'C0 ───> C1 (main)\n └───> C2 (feature)  ──git rebase main──>  C0 ───> C1 (main) ───> C2\' (HEAD, feature)',
    },
    beginnerTips: [
      'Rebase vs Merge: Use Merge when you want to preserve the exact historical timeline; use Rebase when you want a clean, easy-to-read straight line.',
      'Never rebase commits that have already been pushed to a public shared branch, as it changes commit hashes and can confuse your teammates!',
      'Watch how the rebased node gets a dotted halo and a prime (\') symbol in CommitTree.'
    ],
    checkWin: (state: GitState) => {
      const headCommit = state.commits[state.headCommitHash];
      return (
        state.activeBranch === 'feature' &&
        headCommit !== undefined &&
        headCommit.hash.endsWith("'") &&
        headCommit.parents.includes('C1')
      );
    },
  },
  {
    id: 5,
    title: '5. Cherry-Picking Hotfixes',
    description: 'Cherry-picking copies a specific commit from one branch and applies it as a new commit on top of your current HEAD.',
    objective: 'You want to apply the bugfix commit C3 onto "main" without pulling the buggy commit C2. Cherry-pick C3 onto main.',
    startingCommands: [],
    solutionCommands: [
      'git cherry-pick C3',
    ],
    hint: 'Identify the commit hash you want to copy (C3). Run "git cherry-pick C3" while checked out on "main".',
    tutorial: {
      conceptTitle: 'Surgical Precision with Cherry-Pick',
      explanation: [
        'Sometimes an experimental or feature branch contains multiple commits, but you only want to grab one specific bugfix or feature without merging the whole branch.',
        '`git cherry-pick <commit-hash>` acts like a precision copy-paste tool for version control.',
        'It takes the exact changes introduced by the target hash (C3) and creates a brand new copy of that commit directly on top of your current branch.',
        'This is super useful for urgent emergency hotfixes that need to be deployed immediately to production (main) without waiting for unfinished feature code.'
      ],
      diagram: 'C1 (HEAD, main) | C2 ──> C3 (bugfix)  ──git cherry-pick C3──>  C1 ──> C3\' (HEAD, main)',
    },
    beginnerTips: [
      'You can find the commit hash you need by clicking nodes in the graph or running `git log` in the terminal.',
      'Just like rebase, cherry-picking creates a new cloned commit hash (C3\') because it has a different parent than the original.',
      'Make sure you are checked out on the receiving branch before running `git cherry-pick`!'
    ],
    checkWin: (state: GitState) => {
      const headCommit = state.commits[state.headCommitHash];
      return (
        state.activeBranch === 'main' &&
        headCommit !== undefined &&
        headCommit.hash.endsWith("'") &&
        headCommit.parents.includes('C1') &&
        headCommit.message === 'clean hotfix'
      );
    },
    startingState: {
      commits: {
        C0: { hash: 'C0', parents: [], message: 'Initial commit', branch: 'main', isMerge: false, author: 'git@committree', date: '12:00:00' },
        C1: { hash: 'C1', parents: ['C0'], message: 'main work', branch: 'main', isMerge: false, author: 'git@committree', date: '12:01:00' },
        C2: { hash: 'C2', parents: ['C0'], message: 'buggy commit', branch: 'bugfix', isMerge: false, author: 'git@committree', date: '12:02:00' },
        C3: { hash: 'C3', parents: ['C2'], message: 'clean hotfix', branch: 'bugfix', isMerge: false, author: 'git@committree', date: '12:03:00' },
      },
      branches: {
        main: { name: 'main', targetHash: 'C1' },
        bugfix: { name: 'bugfix', targetHash: 'C3' },
      },
      activeBranch: 'main',
      headCommitHash: 'C1',
      commitCounter: 3,
    },
  },
  {
    id: 6,
    title: '6. Resets and Detached HEAD',
    description: 'Resets move branch pointers backwards in time. Checking out a specific commit hash (not a branch) detaches HEAD.',
    objective: 'Reset the "main" branch back to C1 (discarding C2). Then, check out commit C1 directly to enter detached HEAD.',
    startingCommands: [
      'git commit -m "work 1"',
      'git commit -m "work 2"',
    ],
    solutionCommands: [
      'git reset C1',
      'git checkout C1',
    ],
    hint: 'First, reset main to C1 with "git reset C1". Then, check out C1 with "git checkout C1" to detach HEAD.',
    tutorial: {
      conceptTitle: 'Time Travel & Detached HEAD State',
      explanation: [
        'What if you made a mistake and want to erase recent commits from your branch? `git reset <hash>` moves your active branch label backwards in time to an earlier commit.',
        'Any commits that were after the reset target are left behind. If no branch labels point to them anymore, they eventually get cleaned up by Git.',
        'Normally, HEAD is attached to a branch name (like `main`). If you run `git checkout <commit-hash>` directly, HEAD detaches from the branch name and points directly to the raw commit.',
        'This is called a "Detached HEAD" state! You can freely inspect old code or make experimental commits without affecting any existing branches.'
      ],
      diagram: 'C0 ──> C1 ──> C2 (HEAD, main)  ──git reset C1 && git checkout C1──>  C0 ──> C1 (HEAD detached, main)',
    },
    beginnerTips: [
      'Don\'t panic if you see "HEAD detached"! It simply means you are looking at a specific commit rather than the tip of a branch.',
      'To get out of detached HEAD state and return to normal work, just run `git checkout main` or switch to any valid branch.',
      'In real Git, `git reset --hard` discards file modifications too, whereas `git reset --soft` keeps your modified files staged.'
    ],
    checkWin: (state: GitState) => {
      return (
        state.branches['main']?.targetHash === 'C1' &&
        state.activeBranch === null &&
        state.headCommitHash === 'C1'
      );
    },
  },
  {
    id: 7,
    title: '7. Fast-Forward Merge vs 3-Way Merge',
    description: 'When a branch history is a direct continuation of your current branch, Git merges without creating a merge commit by simply fast-forwarding the pointer.',
    objective: 'Fast-forward merge the "hotfix" branch into "main". Make sure you are checked out on "main" before running merge!',
    startingCommands: [
      'git commit -m "main work"',
      'git checkout -b hotfix HEAD',
      'git commit -m "hotfix patch"',
      'git checkout main',
    ],
    solutionCommands: [
      'git merge hotfix',
    ],
    hint: 'Ensure you are checked out on "main", then type "git merge hotfix". Watch how main slides forward without a merge node!',
    tutorial: {
      conceptTitle: 'What is a Fast-Forward Merge?',
      explanation: [
        'Notice how in this scenario, the "main" branch did NOT have any new commits since "hotfix" split off from it.',
        'Because there is no diverging history to combine, Git doesn\'t need to do complex 3-way math or create a 2-parent Merge Commit!',
        'Instead, Git simply slides the "main" branch sticker forward along the timeline until it catches up with the tip of "hotfix".',
        'This cleaner, instant pointer advancement is called a "Fast-Forward Merge" (often abbreviated as `ff` in Git output).'
      ],
      diagram: 'C0 ──> C1 (main) ──> C2 (hotfix)  ──git merge hotfix──>  C0 ──> C1 ──> C2 (HEAD, main, hotfix)',
    },
    beginnerTips: [
      'If you want to force Git to create a merge commit even during a fast-forward situation, in real Git you can pass the `--no-ff` flag.',
      'Fast-forwards keep graph visualizations extremely tidy when merging short-lived bugfix branches.',
      'Notice in the graph that commit C2 does NOT get a double ring because it has only 1 parent!'
    ],
    checkWin: (state: GitState) => {
      const commit = state.commits['C2'];
      return (
        state.activeBranch === 'main' &&
        state.headCommitHash === 'C2' &&
        state.branches['main']?.targetHash === 'C2' &&
        commit !== undefined &&
        !commit.isMerge
      );
    },
  },
  {
    id: 8,
    title: '8. The Clean Rebase Workflow',
    description: 'Combine rebasing and merging to maintain a clean, linear commit graph when collaborating on feature branches.',
    objective: 'First, check out "feature" and rebase it onto "main". Then switch back to "main" and fast-forward merge "feature"!',
    startingCommands: [
      'git commit -m "main release"',
      'git checkout -b feature HEAD~1',
      'git commit -m "feature UI"',
    ],
    solutionCommands: [
      'git rebase main',
      'git checkout main',
      'git merge feature',
    ],
    hint: 'Run "git rebase main" while on feature. Then run "git checkout main" and "git merge feature".',
    tutorial: {
      conceptTitle: 'The Pro Developer Workflow: Rebase then Merge',
      explanation: [
        'In professional software teams, developers often want the best of both worlds: individual feature branches during development, but a clean, straight line when merged into main.',
        'Step 1: Before merging your feature branch, rebase it onto the latest main (`git rebase main`). This updates your feature work to sit cleanly on top of main\'s latest commits.',
        'Step 2: Switch over to main (`git checkout main`) and merge your rebased feature branch (`git merge feature`).',
        'Because rebasing lined up the branches chronologically, Git performs an instant Fast-Forward merge without cluttering history with extra merge bubbles!'
      ],
      diagram: 'Diverged  ──git rebase main──>  Linearized  ──git checkout main && git merge feature──>  Clean Mainline!',
    },
    beginnerTips: [
      'This 2-step pattern is standard practice at major tech companies before merging pull requests.',
      'If you encounter errors during practice, remember you can always click the "Reset Level" button below to start fresh.',
      'Check out how your rebased commit C2\' becomes the new target for both feature and main.'
    ],
    checkWin: (state: GitState) => {
      const mainHash = state.branches['main']?.targetHash;
      const featHash = state.branches['feature']?.targetHash;
      return (
        state.activeBranch === 'main' &&
        mainHash !== undefined &&
        mainHash === featHash &&
        mainHash.endsWith("'")
      );
    },
  },
  {
    id: 9,
    title: '9. Undo & Recover with Reset',
    description: 'Practice using git reset to safely undo unwanted experimental commits on a branch and restore a clean state.',
    objective: 'You made two experimental commits (C2 and C3) on the "experiment" branch that broke the build. Use "git reset C1" to move the branch back to C1.',
    startingCommands: [
      'git commit -m "stable base"',
      'git checkout -b experiment',
      'git commit -m "broken experiment 1"',
      'git commit -m "broken experiment 2"',
    ],
    solutionCommands: [
      'git reset C1',
    ],
    hint: 'Type "git reset C1" while checked out on the experiment branch to move the branch pointer backwards.',
    tutorial: {
      conceptTitle: 'Recovering from Mistakes in Git',
      explanation: [
        'One of the greatest superpowers of Git is that it is almost impossible to permanently lose code if you know how pointers work.',
        'When you realize your recent commits on a branch are going in the wrong direction, you don\'t need to manually delete lines of code.',
        'Running `git reset <target-hash>` tells Git: "Take my current branch sticker and move it back to this earlier checkpoint."',
        'The unwanted commits (C2 and C3) become "orphaned" (unreachable from any branch label) and fade out of your active timeline.'
      ],
      diagram: 'C1 ──> C2 ──> C3 (HEAD, experiment)  ──git reset C1──>  C1 (HEAD, experiment) [C2, C3 detached/orphaned]',
    },
    beginnerTips: [
      'Always double check which branch you are checked out on before running `git reset`!',
      'In a real repository, if you accidentally reset too far, you can use a tool called `git reflog` to find orphaned commit hashes and recover them!',
      'Congratulations on mastering all 9 challenges! You now understand Git pointers, DAGs, and workflows like a pro.'
    ],
    checkWin: (state: GitState) => {
      return (
        state.activeBranch === 'experiment' &&
        state.branches['experiment']?.targetHash === 'C1' &&
        state.headCommitHash === 'C1'
      );
    },
  },
];

export function getStartingStateForChallenge(challenge: Challenge): GitState {
  if (challenge.startingState) {
    return JSON.parse(JSON.stringify(challenge.startingState));
  }

  // Generate state from starting commands
  let state = JSON.parse(JSON.stringify(INITIAL_STATE));

  for (const cmd of challenge.startingCommands) {
    const res = runGitCommand(state, cmd);
    if (!res.error) {
      state = res.state;
    }
  }

  return state;
}

export function getTargetStateForChallenge(challenge: Challenge): GitState {
  let state = getStartingStateForChallenge(challenge);

  for (const cmd of challenge.solutionCommands) {
    const res = runGitCommand(state, cmd);
    if (!res.error) {
      state = res.state;
    }
  }

  return state;
}
