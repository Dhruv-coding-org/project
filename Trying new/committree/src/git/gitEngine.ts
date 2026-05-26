export interface Commit {
  hash: string;
  parents: string[];
  message: string;
  branch: string; // The branch active when this commit was made
  isMerge: boolean;
  isRebasedCopy?: boolean;
  author: string;
  date: string;
}

export interface Branch {
  name: string;
  targetHash: string;
}

export interface GitState {
  commits: { [hash: string]: Commit };
  branches: { [name: string]: Branch };
  activeBranch: string | null; // null if detached HEAD
  headCommitHash: string;
  commitCounter: number;
}

export const INITIAL_STATE: GitState = {
  commits: {
    C0: {
      hash: 'C0',
      parents: [],
      message: 'Initial commit',
      branch: 'main',
      isMerge: false,
      author: 'git@committree',
      date: new Date().toLocaleTimeString(),
    },
  },
  branches: {
    main: {
      name: 'main',
      targetHash: 'C0',
    },
  },
  activeBranch: 'main',
  headCommitHash: 'C0',
  commitCounter: 0,
};

// Ancestry and LCA Helpers
export function getAncestors(commits: { [hash: string]: Commit }, startHash: string): Set<string> {
  const ancestors = new Set<string>();
  const queue: string[] = [startHash];
  while (queue.length > 0) {
    const hash = queue.shift()!;
    if (hash && !ancestors.has(hash)) {
      ancestors.add(hash);
      const commit = commits[hash];
      if (commit && commit.parents) {
        queue.push(...commit.parents);
      }
    }
  }
  return ancestors;
}

export function findLCA(commits: { [hash: string]: Commit }, hashA: string, hashB: string): string | null {
  const ancestorsA = getAncestors(commits, hashA);
  const queue: string[] = [hashB];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const hash = queue.shift()!;
    if (visited.has(hash)) continue;
    visited.add(hash);
    if (ancestorsA.has(hash)) {
      return hash;
    }
    const commit = commits[hash];
    if (commit && commit.parents) {
      queue.push(...commit.parents);
    }
  }
  return null;
}

// Generate the next sequential commit name (C1, C2, C3...)
function getNextCommitHash(state: GitState): string {
  return `C${state.commitCounter + 1}`;
}

export interface GitCommandResult {
  state: GitState;
  output: string[];
  error?: string;
}

export function runGitCommand(state: GitState, commandStr: string): GitCommandResult {
  const parts = commandStr.trim().split(/\s+/);
  if (parts[0] !== 'git') {
    return { state, output: [], error: `Unknown command: "${parts[0]}". Did you mean "git"?` };
  }

  const action = parts[1];
  if (!action) {
    return { state, output: ['Usage: git <command> [<args>]', '', 'Available commands in this simulator:', '  commit, checkout, branch, merge, rebase, cherry-pick, reset, log, status'] };
  }

  switch (action) {
    case 'commit':
      return handleCommit(state, parts.slice(2));
    case 'branch':
      return handleBranch(state, parts.slice(2));
    case 'checkout':
    case 'switch':
      return handleCheckout(state, parts.slice(2));
    case 'merge':
      return handleMerge(state, parts.slice(2));
    case 'rebase':
      return handleRebase(state, parts.slice(2));
    case 'cherry-pick':
      return handleCherryPick(state, parts.slice(2));
    case 'reset':
      return handleReset(state, parts.slice(2));
    case 'log':
      return handleLog(state);
    case 'status':
      return handleStatus(state);
    default:
      return { state, output: [], error: `git command "${action}" is not supported yet.` };
  }
}

function handleCommit(state: GitState, args: string[]): GitCommandResult {
  let message = 'Update';
  const mIndex = args.indexOf('-m');
  if (mIndex !== -1 && args[mIndex + 1]) {
    // Reconstruct message from quotes if necessary, or just take the argument next to -m
    let msgArg = args.slice(mIndex + 1).join(' ');
    if (msgArg.startsWith('"') && msgArg.endsWith('"')) {
      message = msgArg.slice(1, -1);
    } else if (msgArg.startsWith("'") && msgArg.endsWith("'")) {
      message = msgArg.slice(1, -1);
    } else {
      message = args[mIndex + 1];
    }
  }

  const nextHash = getNextCommitHash(state);
  const activeBranch = state.activeBranch;
  const currentBranchName = activeBranch || 'HEAD (detached)';

  const newCommit: Commit = {
    hash: nextHash,
    parents: [state.headCommitHash],
    message,
    branch: currentBranchName,
    isMerge: false,
    author: 'user@committree',
    date: new Date().toLocaleTimeString(),
  };

  const newCommits = { ...state.commits, [nextHash]: newCommit };
  const newBranches = { ...state.branches };

  if (activeBranch && newBranches[activeBranch]) {
    newBranches[activeBranch] = {
      ...newBranches[activeBranch],
      targetHash: nextHash,
    };
  }

  const output = [
    `[${currentBranchName} ${nextHash}] ${message}`,
    ` 1 file changed, 1 insertion(+)`,
  ];

  if (!activeBranch) {
    output.unshift(`Warning: You are committing in a detached HEAD state.`, `This commit does not belong to any branch.`);
  }

  return {
    state: {
      ...state,
      commits: newCommits,
      branches: newBranches,
      headCommitHash: nextHash,
      commitCounter: state.commitCounter + 1,
    },
    output,
  };
}

function handleBranch(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    // List branches
    const list = Object.keys(state.branches).map(b => {
      const prefix = b === state.activeBranch ? '* ' : '  ';
      return `${prefix}${b}`;
    });
    return { state, output: list };
  }

  const deleteIndex = args.indexOf('-d');
  if (deleteIndex !== -1) {
    const branchToDelete = args[deleteIndex + 1];
    if (!branchToDelete) {
      return { state, output: [], error: 'Branch name to delete missing.' };
    }
    if (branchToDelete === 'main' || branchToDelete === 'master') {
      return { state, output: [], error: `Cannot delete default branch "${branchToDelete}"` };
    }
    if (branchToDelete === state.activeBranch) {
      return { state, output: [], error: `Cannot delete active branch "${branchToDelete}"` };
    }
    if (!state.branches[branchToDelete]) {
      return { state, output: [], error: `Branch "${branchToDelete}" not found.` };
    }
    const newBranches = { ...state.branches };
    delete newBranches[branchToDelete];
    return {
      state: { ...state, branches: newBranches },
      output: [`Deleted branch ${branchToDelete} (was ${state.branches[branchToDelete].targetHash}).`],
    };
  }

  const branchName = args[0];
  if (state.branches[branchName]) {
    return { state, output: [], error: `Fatal: A branch named '${branchName}' already exists.` };
  }

  const newBranches = {
    ...state.branches,
    [branchName]: {
      name: branchName,
      targetHash: state.headCommitHash,
    },
  };

  return {
    state: { ...state, branches: newBranches },
    output: [`Created branch '${branchName}' pointing at ${state.headCommitHash}`],
  };
}

function handleCheckout(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: [], error: 'Please specify a branch name or commit hash to check out.' };
  }

  // Support checkout -b <branchName>
  if (args[0] === '-b') {
    const newBranchName = args[1];
    if (!newBranchName) {
      return { state, output: [], error: 'Missing new branch name.' };
    }
    const branchRes = handleBranch(state, [newBranchName]);
    if (branchRes.error) return branchRes;
    return handleCheckout(branchRes.state, [newBranchName]);
  }

  const target = args[0];

  // Resolve target if it is relative (e.g. HEAD~1)
  let resolvedHash = target;
  if (target === 'HEAD') {
    resolvedHash = state.headCommitHash;
  } else if (target.startsWith('HEAD~')) {
    const num = parseInt(target.replace('HEAD~', ''), 10);
    let curr: string | null = state.headCommitHash;
    for (let i = 0; i < num; i++) {
      if (curr && state.commits[curr] && state.commits[curr].parents.length > 0) {
        curr = state.commits[curr].parents[0];
      } else {
        curr = null;
        break;
      }
    }
    if (!curr) {
      return { state, output: [], error: `Fatal: Path '${target}' does not exist.` };
    }
    resolvedHash = curr;
  }

  // 1. Is it a branch name?
  if (state.branches[resolvedHash]) {
    const branch = state.branches[resolvedHash];
    return {
      state: {
        ...state,
        activeBranch: branch.name,
        headCommitHash: branch.targetHash,
      },
      output: [`Switched to branch '${branch.name}'`],
    };
  }

  // 2. Is it a commit hash?
  if (state.commits[resolvedHash]) {
    return {
      state: {
        ...state,
        activeBranch: null, // Detach HEAD
        headCommitHash: resolvedHash,
      },
      output: [
        `Note: switching to '${resolvedHash}'.`,
        `You are in 'detached HEAD' state. You can look around, make experimental`,
        `commits and commit them, and you can discard any commits you make in this`,
        `state without impacting any branches by performing another checkout.`,
        ``,
        `HEAD is now at ${resolvedHash} ${state.commits[resolvedHash].message}`,
      ],
    };
  }

  return { state, output: [], error: `error: pathspec '${target}' did not match any file(s) known to git` };
}

function handleMerge(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: [], error: 'Please specify a branch to merge.' };
  }

  const targetBranchName = args[0];
  if (!state.branches[targetBranchName]) {
    return { state, output: [], error: `merge: ${targetBranchName} - not something we can merge` };
  }

  const activeBranch = state.activeBranch;
  if (!activeBranch) {
    return { state, output: [], error: 'Error: You are in a detached HEAD state. Switch to a branch to merge.' };
  }

  if (activeBranch === targetBranchName) {
    return { state, output: ['Already up to date.'] };
  }

  const headHash = state.headCommitHash;
  const targetHash = state.branches[targetBranchName].targetHash;

  const lca = findLCA(state.commits, headHash, targetHash);

  // Case 1: Target is already ancestor of HEAD (already merged)
  if (lca === targetHash) {
    return { state, output: ['Already up to date.'] };
  }

  // Case 2: HEAD is ancestor of target (Fast-Forward Merge)
  if (lca === headHash) {
    const newBranches = {
      ...state.branches,
      [activeBranch]: {
        ...state.branches[activeBranch],
        targetHash: targetHash,
      },
    };
    return {
      state: {
        ...state,
        branches: newBranches,
        headCommitHash: targetHash,
      },
      output: [
        `Updating ${headHash.toLowerCase()}..${targetHash.toLowerCase()}`,
        `Fast-forward`,
        ` 1 file changed, 1 insertion(+)`,
      ],
    };
  }

  // Case 3: 3-way merge
  const nextHash = getNextCommitHash(state);
  const mergeMsg = `Merge branch '${targetBranchName}' into ${activeBranch}`;
  const mergeCommit: Commit = {
    hash: nextHash,
    parents: [headHash, targetHash],
    message: mergeMsg,
    branch: activeBranch,
    isMerge: true,
    author: 'user@committree',
    date: new Date().toLocaleTimeString(),
  };

  const newCommits = { ...state.commits, [nextHash]: mergeCommit };
  const newBranches = {
    ...state.branches,
    [activeBranch]: {
      ...state.branches[activeBranch],
      targetHash: nextHash,
    },
  };

  return {
    state: {
      ...state,
      commits: newCommits,
      branches: newBranches,
      headCommitHash: nextHash,
      commitCounter: state.commitCounter + 1,
    },
    output: [
      `Merge made by the 'ort' strategy.`,
      ` ${mergeMsg}`,
    ],
  };
}

function handleRebase(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: [], error: 'Please specify a branch to rebase onto.' };
  }

  const targetBranchName = args[0];
  if (!state.branches[targetBranchName]) {
    return { state, output: [], error: `rebase: branch '${targetBranchName}' does not exist.` };
  }

  const activeBranch = state.activeBranch;
  if (!activeBranch) {
    return { state, output: [], error: 'Error: You are in a detached HEAD state. Switch to a branch to rebase.' };
  }

  const headHash = state.headCommitHash;
  const targetHash = state.branches[targetBranchName].targetHash;

  if (headHash === targetHash) {
    return { state, output: [`Current branch ${activeBranch} is up to date.`] };
  }

  const lca = findLCA(state.commits, headHash, targetHash);

  // If LCA is the target branch, main is already behind/ancestor of our branch
  if (lca === targetHash) {
    return { state, output: [`Current branch ${activeBranch} is up to date with ${targetBranchName}.`] };
  }

  // If LCA is the headHash (we are behind main, fast-forward rebase)
  if (lca === headHash) {
    const newBranches = {
      ...state.branches,
      [activeBranch]: {
        ...state.branches[activeBranch],
        targetHash: targetHash,
      },
    };
    return {
      state: {
        ...state,
        branches: newBranches,
        headCommitHash: targetHash,
      },
      output: [
        `Successfully rebased and updated refs/heads/${activeBranch} onto ${targetBranchName} (fast-forward).`,
      ],
    };
  }

  // 3. General Rebase: Cherry-pick commits along our branch's fork onto main's tip.
  // Collect commits from fork point (LCA) to headHash (traversing parent[0])
  const commitsToRebase: Commit[] = [];
  let curr = state.commits[headHash];
  while (curr && curr.hash !== lca) {
    commitsToRebase.push(curr);
    if (curr.parents.length > 0) {
      curr = state.commits[curr.parents[0]];
    } else {
      break;
    }
  }

  commitsToRebase.reverse(); // Chronological oldest to newest

  let currentParentHash = targetHash;
  let counter = state.commitCounter;
  const updatedCommits = { ...state.commits };

  // Re-apply each commit as a rebased copy
  const output: string[] = [];
  for (const origCommit of commitsToRebase) {
    counter += 1;
    const rebasedHash = `C${counter}'`; // Visual rebased indicator
    const newCommit: Commit = {
      hash: rebasedHash,
      parents: [currentParentHash],
      message: origCommit.message,
      branch: activeBranch,
      isMerge: origCommit.isMerge,
      isRebasedCopy: true,
      author: origCommit.author,
      date: new Date().toLocaleTimeString(),
    };
    updatedCommits[rebasedHash] = newCommit;
    currentParentHash = rebasedHash;
    output.push(`Applying: ${origCommit.message}`);
  }

  const newBranches = {
    ...state.branches,
    [activeBranch]: {
      ...state.branches[activeBranch],
      targetHash: currentParentHash,
    },
  };

  return {
    state: {
      ...state,
      commits: updatedCommits,
      branches: newBranches,
      headCommitHash: currentParentHash,
      commitCounter: counter,
    },
    output: [
      ...output,
      `Successfully rebased and updated refs/heads/${activeBranch} onto ${targetBranchName}.`,
    ],
  };
}

function handleCherryPick(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: [], error: 'Please specify a commit hash to cherry-pick.' };
  }

  const targetHash = args[0];
  const origCommit = state.commits[targetHash];
  if (!origCommit) {
    return { state, output: [], error: `error: Bad revision '${targetHash}'` };
  }

  if (targetHash === state.headCommitHash) {
    return { state, output: [], error: 'error: Cherry-picking the current HEAD is redundant.' };
  }

  const nextHash = `C${state.commitCounter + 1}'`; // Visual cherry-pick notation
  const activeBranch = state.activeBranch;
  const currentBranchName = activeBranch || 'HEAD (detached)';

  const newCommit: Commit = {
    hash: nextHash,
    parents: [state.headCommitHash],
    message: origCommit.message,
    branch: currentBranchName,
    isMerge: false,
    isRebasedCopy: true,
    author: 'user@committree',
    date: new Date().toLocaleTimeString(),
  };

  const newCommits = { ...state.commits, [nextHash]: newCommit };
  const newBranches = { ...state.branches };

  if (activeBranch && newBranches[activeBranch]) {
    newBranches[activeBranch] = {
      ...newBranches[activeBranch],
      targetHash: nextHash,
    };
  }

  return {
    state: {
      ...state,
      commits: newCommits,
      branches: newBranches,
      headCommitHash: nextHash,
      commitCounter: state.commitCounter + 1,
    },
    output: [
      `[${currentBranchName} ${nextHash}] ${origCommit.message}`,
      ` Date: ${newCommit.date}`,
      ` 1 file changed, 1 insertion(+)`,
    ],
  };
}

function handleReset(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: [], error: 'Please specify a commit target to reset to (e.g. HEAD~1, a branch, or commit hash).' };
  }

  let mode: 'soft' | 'hard' | 'mixed' = 'mixed';
  let targetArg = args[0];
  if (args[0] === '--soft') {
    mode = 'soft';
    targetArg = args[1];
  } else if (args[0] === '--hard') {
    mode = 'hard';
    targetArg = args[1];
  }

  if (!targetArg) {
    return { state, output: [], error: 'Missing target commit for reset.' };
  }

  // Resolve target
  let resolvedHash = targetArg;
  if (targetArg === 'HEAD') {
    resolvedHash = state.headCommitHash;
  } else if (targetArg.startsWith('HEAD~')) {
    const num = parseInt(targetArg.replace('HEAD~', ''), 10);
    let curr: string | null = state.headCommitHash;
    for (let i = 0; i < num; i++) {
      if (curr && state.commits[curr] && state.commits[curr].parents.length > 0) {
        curr = state.commits[curr].parents[0];
      } else {
        curr = null;
        break;
      }
    }
    if (!curr) {
      return { state, output: [], error: `Fatal: Path '${targetArg}' does not exist.` };
    }
    resolvedHash = curr;
  } else if (state.branches[targetArg]) {
    resolvedHash = state.branches[targetArg].targetHash;
  }

  if (!state.commits[resolvedHash]) {
    return { state, output: [], error: `Fatal: Commit '${targetArg}' does not exist.` };
  }

  const activeBranch = state.activeBranch;
  const newBranches = { ...state.branches };

  if (activeBranch && newBranches[activeBranch]) {
    newBranches[activeBranch] = {
      ...newBranches[activeBranch],
      targetHash: resolvedHash,
    };
  }

  const output = [
    `HEAD is now at ${resolvedHash} ${state.commits[resolvedHash].message}`,
  ];
  if (mode === 'hard') {
    output.push('Unstaged changes discarded.');
  } else if (mode === 'soft') {
    output.push('Changes kept in index (staged).');
  }

  return {
    state: {
      ...state,
      branches: newBranches,
      headCommitHash: resolvedHash,
    },
    output,
  };
}

function handleLog(state: GitState): GitCommandResult {
  const list: string[] = [];
  let curr: string | null = state.headCommitHash;
  const visited = new Set<string>();

  while (curr && state.commits[curr]) {
    if (visited.has(curr)) break;
    visited.add(curr);
    const commit: Commit = state.commits[curr];
    list.push(
      `commit ${commit.hash}`,
      `Author: ${commit.author}`,
      `Date:   ${commit.date}`,
      ``,
      `    ${commit.message}`,
      ``
    );
    if (commit.parents.length > 0) {
      curr = commit.parents[0];
    } else {
      curr = null;
    }
  }

  return { state, output: list };
}

function handleStatus(state: GitState): GitCommandResult {
  const activeBranch = state.activeBranch;
  const output = [];

  if (activeBranch) {
    output.push(`On branch ${activeBranch}`, `Your branch is up to date.`);
  } else {
    output.push(`HEAD detached at ${state.headCommitHash}`, `nothing to commit, working tree clean`);
  }

  return { state, output };
}
