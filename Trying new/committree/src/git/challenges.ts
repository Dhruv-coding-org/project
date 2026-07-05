import { type GitState, INITIAL_STATE, runGitCommand } from './gitEngine';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  objective: string;
  startingCommands: string[];
  startingState?: Partial<GitState>;
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
      'Great job understanding git reset! Get ready to learn about tags, stashing, reverting, and remote synchronization next.'
    ],
    checkWin: (state: GitState) => {
      return (
        state.activeBranch === 'experiment' &&
        state.branches['experiment']?.targetHash === 'C1' &&
        state.headCommitHash === 'C1'
      );
    },
  },
  {
    id: 10,
    title: '10. Tagging Releases',
    description: 'Release tags attach immutable, permanent milestones (like v1.0 or v2.5) to specific commit hashes.',
    objective: 'Tag commit C1 as "v1.0.0".',
    startingCommands: [
      'git commit -m "feature A"',
      'git commit -m "feature B"',
    ],
    solutionCommands: [
      'git tag v1.0.0 C1',
    ],
    hint: 'Run "git tag v1.0.0 C1" in the terminal to attach a tag badge to commit C1.',
    tutorial: {
      conceptTitle: 'Permanent Milestone Markers with Tags',
      explanation: [
        'While branch pointers move forward every time you create a new commit, Release Tags are designed to never move!',
        'When you release version 1.0 of your software, running `git tag v1.0.0 <hash>` attaches a permanent milestone badge to that exact commit.',
        'This allows developers, automated CI/CD pipelines, and users to return to exact production builds months or years later without guessing commit hashes.'
      ],
      diagram: 'C0 ──> C1 [🏷️ v1.0.0] ──> C2 (HEAD, main)',
    },
    beginnerTips: [
      'If you omit the commit hash (e.g. `git tag v1.0.0`), Git automatically tags your current HEAD commit!',
      'You can delete a tag anytime with `git tag -d <tagname>`.',
      'Look closely at the graph on the left: notice the golden badge attached to C1!'
    ],
    checkWin: (state: GitState) => {
      return state.tags?.['v1.0.0'] === 'C1';
    },
  },
  {
    id: 11,
    title: '11. Stashing Work',
    description: 'Stashing temporarily shelves dirty working directory changes onto a clean stack so you can switch branches safely.',
    objective: 'Stash your uncommitted work onto the shelf using "git stash".',
    startingCommands: [
      'git commit -m "base work"',
    ],
    solutionCommands: [
      'git stash',
    ],
    hint: 'Type "git stash" in the terminal to shelve your uncommitted changes.',
    tutorial: {
      conceptTitle: 'The Magic Shelf: Git Stash',
      explanation: [
        'Imagine you are half-way through coding a messy feature when an urgent bug report comes in. You cannot commit broken code, but switching branches would overwrite your unfinished work!',
        '`git stash` acts like a safe temporary shelf. It takes all your uncommitted modifications and slides them onto a clean stack, reverting your working tree to a clean state.',
        'Once you finish fixing the urgent bug on another branch, you can switch back and run `git stash pop` to pull your unfinished work right back off the shelf!'
      ],
      diagram: '[Dirty Worktree]  ──git stash──>  [Clean Worktree] + Stash@{0}',
    },
    beginnerTips: [
      'Run `git stash list` to see all items currently stored on your stash stack.',
      'Unlike branch commits, stashed items are global to your workspace and can be popped onto any branch!',
      'You can stash multiple times; Git stacks them like trays in a cafeteria.'
    ],
    checkWin: (state: GitState) => {
      return (state.stash && state.stash.length > 0);
    },
  },
  {
    id: 12,
    title: '12. Undoing with Revert',
    description: 'Unlike reset which rewinds history, revert creates a brand new commit that safely reverses and inverts earlier changes.',
    objective: 'Revert commit C1 to safely undo its changes without deleting shared commit history.',
    startingCommands: [
      'git commit -m "bad commit"',
    ],
    solutionCommands: [
      'git revert C1',
    ],
    hint: 'Run "git revert C1" while on main to generate an inverting revert commit.',
    tutorial: {
      conceptTitle: 'Team-Friendly Undoing with Git Revert',
      explanation: [
        'In Level 6 and 9, you used `git reset` to erase commits. However, if you already pushed those commits to GitHub and coworkers pulled them, resetting causes massive sync conflicts!',
        '`git revert <commit-hash>` is the professional, team-safe way to undo mistakes in shared codebases.',
        'Instead of deleting historical nodes, it creates a brand new commit that does the exact opposite of the target commit (deleting added lines and restoring removed lines).',
        'Your commit timeline keeps moving forward linearly, preserving a completely transparent audit trail!'
      ],
      diagram: 'C0 ──> C1 (bad) ──> C2  ──git revert C1──>  C0 ──> C1 ──> C2 ──> C3 [Revert "bad commit"]',
    },
    beginnerTips: [
      'Reverting does not erase history; it adds a new commit that cancels out an old commit.',
      'Notice how the generated commit message automatically starts with `Revert "..."`.',
      'Always use `revert` instead of `reset` on main or production branches!'
    ],
    checkWin: (state: GitState) => {
      const headCommit = state.commits[state.headCommitHash];
      return (
        headCommit !== undefined &&
        headCommit.message.startsWith('Revert') &&
        headCommit.parents.includes('C1')
      );
    },
  },
  {
    id: 13,
    title: '13. Amending Commit Messages',
    description: 'The --amend flag lets you quickly replace the last commit on your current branch with a new commit and message.',
    objective: 'Amend the last commit message from "oops typo" to "Clean release".',
    startingCommands: [
      'git commit -m "oops typo"',
    ],
    solutionCommands: [
      'git commit --amend -m "Clean release"',
    ],
    hint: 'Run "git commit --amend -m \'Clean release\'" to update the last commit message.',
    tutorial: {
      conceptTitle: 'Fixing Last-Minute Typos with Commit --Amend',
      explanation: [
        'Have you ever hit Enter on `git commit` and immediately noticed a glaring typo in your commit message or forgot to include a staged file?',
        'Instead of making a messy follow-up commit like "fix typo", running `git commit --amend -m "<new-msg>"` replaces the tip commit of your branch.',
        'Under the hood, Git generates a brand new commit hash with the corrected message and swaps it into place!'
      ],
      diagram: 'C0 ──> C1 ("oops typo")  ──git commit --amend──>  C0 ──> C1\' ("Clean release")',
    },
    beginnerTips: [
      'Notice how the commit hash changes from C1 to C1\' when amended!',
      'Just like rebase, only amend commits that have NOT been pushed to a remote shared server yet.',
      'You can also stage new files before running `--amend` to slip forgotten files into the last commit.'
    ],
    checkWin: (state: GitState) => {
      const headCommit = state.commits[state.headCommitHash];
      return (
        headCommit !== undefined &&
        headCommit.message === 'Clean release' &&
        headCommit.hash.endsWith("'")
      );
    },
  },
  {
    id: 14,
    title: '14. Fetching & Pulling Remotes',
    description: 'Collaborating with teammates requires syncing with servers. Fetch downloads remote commits; Pull fetches and merges.',
    objective: 'Pull the latest coworker changes from the remote server origin/main into your local main branch.',
    startingCommands: [],
    solutionCommands: [
      'git pull origin main',
    ],
    hint: 'Type "git pull origin main" to fetch and merge server commits into your branch.',
    tutorial: {
      conceptTitle: 'Syncing with Remote Servers: Fetch vs Pull',
      explanation: [
        'When working with teams on GitHub, GitLab, or Bitbucket, your coworkers push new commits to remote servers.',
        'To see what your coworkers did, `git fetch origin` downloads their commit nodes and updates your tracking pointers (like `origin/main`) without touching your working files.',
        '`git pull origin main` is the ultimate time-saver: it performs a `git fetch` followed immediately by a `git merge` to seamlessly blend remote commits into your active branch!'
      ],
      diagram: 'Local main behind origin/main (C2)  ──git pull origin main──>  Local main merged & advanced to C2',
    },
    beginnerTips: [
      'Notice the purple remote badge `🌐 origin/main` in the graph!',
      'Always run `git pull` at the start of your workday before writing new code to avoid merge conflicts later.',
      'If you want to inspect remote changes before blending them, run `git fetch` first!'
    ],
    checkWin: (state: GitState) => {
      return (
        state.branches['main']?.targetHash === 'C2' &&
        state.headCommitHash === 'C2'
      );
    },
    startingState: {
      commits: {
        C0: { hash: 'C0', parents: [], message: 'Initial commit', branch: 'main', isMerge: false, author: 'git@committree', date: '12:00:00' },
        C1: { hash: 'C1', parents: ['C0'], message: 'local work', branch: 'main', isMerge: false, author: 'git@committree', date: '12:01:00' },
        C2: { hash: 'C2', parents: ['C1'], message: 'coworker feature', branch: 'main', isMerge: false, author: 'coworker@github', date: '12:02:00' },
      },
      branches: {
        main: { name: 'main', targetHash: 'C1' },
      },
      remotes: {
        'origin/main': { name: 'origin/main', targetHash: 'C2' },
      },
      tags: {},
      stash: [],
      activeBranch: 'main',
      headCommitHash: 'C1',
      commitCounter: 2,
    },
  },
  {
    id: 15,
    title: '15. Pushing Your Code',
    description: 'Pushing uploads your local branch commits to the server and advances remote tracking branches like origin/main.',
    objective: 'Push your local commit C2 up to the remote origin server.',
    startingCommands: [],
    solutionCommands: [
      'git push origin main',
    ],
    hint: 'Type "git push origin main" in the terminal to upload your commits to the server.',
    tutorial: {
      conceptTitle: 'Publishing Your Work with Git Push',
      explanation: [
        'Once your feature is complete, tested, and committed locally, it is time to share it with the world!',
        'Running `git push origin main` uploads your local commits to the remote server `origin` and advances the remote tracking branch `origin/main` to match your local branch tip.',
        'Congratulations on completing all 15 master levels of CommitTree! You are now a certified Git Grandmaster!'
      ],
      diagram: 'Local C2 ahead of origin/main (C1)  ──git push origin main──>  origin/main advanced to C2',
    },
    beginnerTips: [
      'If a coworker pushed commits while you were working, Git will reject your push! You must run `git pull` to merge their changes first before pushing.',
      'Always verify your code builds cleanly and unit tests pass before executing `git push`.',
      '🎉 You have conquered the entire Git campaign! Switch to Sandbox mode or the 3D Command Guide to continue experimenting anytime.'
    ],
    checkWin: (state: GitState) => {
      return (
        state.remotes?.['origin/main']?.targetHash === 'C2'
      );
    },
    startingState: {
      commits: {
        C0: { hash: 'C0', parents: [], message: 'Initial commit', branch: 'main', isMerge: false, author: 'git@committree', date: '12:00:00' },
        C1: { hash: 'C1', parents: ['C0'], message: 'base work', branch: 'main', isMerge: false, author: 'git@committree', date: '12:01:00' },
        C2: { hash: 'C2', parents: ['C1'], message: 'my new feature', branch: 'main', isMerge: false, author: 'player@committree', date: '12:02:00' },
      },
      branches: {
        main: { name: 'main', targetHash: 'C2' },
      },
      remotes: {
        'origin/main': { name: 'origin/main', targetHash: 'C1' },
      },
      tags: {},
      stash: [],
      activeBranch: 'main',
      headCommitHash: 'C2',
      commitCounter: 2,
    },
  },
];

export function getStartingStateForChallenge(challenge: Challenge): GitState {
  if (challenge.startingState) {
    return {
      ...JSON.parse(JSON.stringify(INITIAL_STATE)),
      ...JSON.parse(JSON.stringify(challenge.startingState)),
    };
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
