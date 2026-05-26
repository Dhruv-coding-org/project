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
    checkWin: (state: GitState) => {
      const headCommit = state.commits[state.headCommitHash];
      return (
        state.activeBranch === 'main' &&
        headCommit !== undefined &&
        headCommit.hash.endsWith("'") &&
        headCommit.parents.includes('C1') && // applied on top of main work C1
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
    checkWin: (state: GitState) => {
      return (
        state.branches['main']?.targetHash === 'C1' &&
        state.activeBranch === null &&
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
