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
  tags: { [name: string]: string }; // Map tag name to commit hash
  stash: string[]; // Stack of stashed work descriptions
  remotes: { [name: string]: Branch }; // Simulated remote tracking branches (e.g. origin/main)
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
  tags: {},
  stash: [],
  remotes: {
    'origin/main': {
      name: 'origin/main',
      targetHash: 'C0',
    },
  },
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
    return { state, output: ['Usage: git <command> [<args>]', '', 'Available commands in this simulator:', '  commit, branch, checkout, switch, merge, rebase, cherry-pick, reset, tag, stash, revert, fetch, pull, push, log, status'] };
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
    case 'tag':
      return handleTag(state, parts.slice(2));
    case 'stash':
      return handleStash(state, parts.slice(2));
    case 'revert':
      return handleRevert(state, parts.slice(2));
    case 'fetch':
      return handleFetch(state, parts.slice(2));
    case 'pull':
      return handlePull(state, parts.slice(2));
    case 'push':
      return handlePush(state, parts.slice(2));
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
    let msgArg = args.slice(mIndex + 1).join(' ');
    if (msgArg.startsWith('"') && msgArg.endsWith('"')) {
      message = msgArg.slice(1, -1);
    } else if (msgArg.startsWith("'") && msgArg.endsWith("'")) {
      message = msgArg.slice(1, -1);
    } else {
      message = args[mIndex + 1];
    }
  }

  const isAmend = args.includes('--amend');
  const activeBranch = state.activeBranch;
  const currentBranchName = activeBranch || 'HEAD (detached)';

  if (isAmend) {
    const oldCommit = state.commits[state.headCommitHash];
    if (!oldCommit) {
      return { state, output: [], error: 'Cannot amend: no HEAD commit found.' };
    }
    // Create amended hash with a prime suffix or counter
    const amendedHash = oldCommit.hash.endsWith("'") ? `${oldCommit.hash}'` : `${oldCommit.hash}'`;
    const newCommit: Commit = {
      ...oldCommit,
      hash: amendedHash,
      message: mIndex !== -1 ? message : oldCommit.message,
      date: new Date().toLocaleTimeString(),
    };

    const newCommits = { ...state.commits, [amendedHash]: newCommit };
    const newBranches = { ...state.branches };

    if (activeBranch && newBranches[activeBranch]) {
      newBranches[activeBranch] = {
        ...newBranches[activeBranch],
        targetHash: amendedHash,
      };
    }

    return {
      state: {
        ...state,
        commits: newCommits,
        branches: newBranches,
        headCommitHash: amendedHash,
      },
      output: [
        `[${currentBranchName} ${amendedHash}] ${newCommit.message}`,
        ` Date: ${newCommit.date}`,
        ` 1 file changed, 1 insertion(+) (amended)`,
      ],
    };
  }

  const nextHash = getNextCommitHash(state);

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

  if (state.commits[resolvedHash]) {
    return {
      state: {
        ...state,
        activeBranch: null,
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
  const targetBranch = state.branches[targetBranchName] || state.remotes[targetBranchName];
  if (!targetBranch) {
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
  const targetHash = targetBranch.targetHash;

  const lca = findLCA(state.commits, headHash, targetHash);

  if (lca === targetHash) {
    return { state, output: ['Already up to date.'] };
  }

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
  const targetBranch = state.branches[targetBranchName] || state.remotes[targetBranchName];
  if (!targetBranch) {
    return { state, output: [], error: `rebase: branch '${targetBranchName}' does not exist.` };
  }

  const activeBranch = state.activeBranch;
  if (!activeBranch) {
    return { state, output: [], error: 'Error: You are in a detached HEAD state. Switch to a branch to rebase.' };
  }

  const headHash = state.headCommitHash;
  const targetHash = targetBranch.targetHash;

  if (headHash === targetHash) {
    return { state, output: [`Current branch ${activeBranch} is up to date.`] };
  }

  const lca = findLCA(state.commits, headHash, targetHash);

  if (lca === targetHash) {
    return { state, output: [`Current branch ${activeBranch} is up to date with ${targetBranchName}.`] };
  }

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

  commitsToRebase.reverse();

  let currentParentHash = targetHash;
  let counter = state.commitCounter;
  const updatedCommits = { ...state.commits };

  const output: string[] = [];
  for (const origCommit of commitsToRebase) {
    counter += 1;
    const rebasedHash = `C${counter}'`;
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

  const nextHash = `C${state.commitCounter + 1}'`;
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

function handleTag(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: Object.keys(state.tags || {}) };
  }

  if (args[0] === '-d') {
    const tagName = args[1];
    if (!tagName || !state.tags[tagName]) {
      return { state, output: [], error: `error: tag '${tagName}' not found.` };
    }
    const newTags = { ...state.tags };
    delete newTags[tagName];
    return {
      state: { ...state, tags: newTags },
      output: [`Deleted tag '${tagName}' (was ${state.tags[tagName]})`],
    };
  }

  const tagName = args[0];
  const targetHash = args[1] || state.headCommitHash;

  if (!state.commits[targetHash]) {
    return { state, output: [], error: `error: commit '${targetHash}' does not exist.` };
  }

  const newTags = { ...(state.tags || {}), [tagName]: targetHash };
  return {
    state: { ...state, tags: newTags },
    output: [`Created tag '${tagName}' at commit ${targetHash}`],
  };
}

function handleStash(state: GitState, args: string[]): GitCommandResult {
  const subAction = args[0] || 'push';
  const stashList = state.stash || [];

  if (subAction === 'list') {
    if (stashList.length === 0) {
      return { state, output: ['No stashed changes found.'] };
    }
    return {
      state,
      output: stashList.map((item, idx) => `stash@{${idx}}: ${item}`),
    };
  }

  if (subAction === 'pop' || subAction === 'apply') {
    if (stashList.length === 0) {
      return { state, output: [], error: 'No stash entries found.' };
    }
    const newStash = subAction === 'pop' ? stashList.slice(1) : stashList;
    const popped = stashList[0];
    return {
      state: { ...state, stash: newStash },
      output: [
        `Applied stash: ${popped}`,
        subAction === 'pop' ? `Dropped refs/stash@{0} (${popped})` : `Kept stash entry.`,
      ],
    };
  }

  // Push / save stash
  const desc = args.length > 0 && args[0] !== 'push' ? args.join(' ') : `WIP on ${state.activeBranch || 'detached HEAD'}: ${state.headCommitHash} ${state.commits[state.headCommitHash]?.message}`;
  const newStash = [desc, ...stashList];
  return {
    state: { ...state, stash: newStash },
    output: [
      `Saved working directory and index state "${desc}"`,
      `HEAD is now at ${state.headCommitHash} ${state.commits[state.headCommitHash]?.message}`,
    ],
  };
}

function handleRevert(state: GitState, args: string[]): GitCommandResult {
  if (args.length === 0) {
    return { state, output: [], error: 'Please specify a commit hash to revert.' };
  }

  const targetHash = args[0];
  const origCommit = state.commits[targetHash];
  if (!origCommit) {
    return { state, output: [], error: `error: bad revision '${targetHash}'` };
  }

  const nextHash = getNextCommitHash(state);
  const activeBranch = state.activeBranch;
  const currentBranchName = activeBranch || 'HEAD (detached)';
  const revertMsg = `Revert "${origCommit.message}"`;

  const newCommit: Commit = {
    hash: nextHash,
    parents: [state.headCommitHash],
    message: revertMsg,
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

  return {
    state: {
      ...state,
      commits: newCommits,
      branches: newBranches,
      headCommitHash: nextHash,
      commitCounter: state.commitCounter + 1,
    },
    output: [
      `[${currentBranchName} ${nextHash}] ${revertMsg}`,
      ` 1 file changed, 1 deletion(-) (revert)`,
    ],
  };
}

function handleFetch(state: GitState, args: string[]): GitCommandResult {
  const remoteName = args[0] || 'origin';
  const branchName = args[1] || 'main';
  const remoteRef = `${remoteName}/${branchName}`;

  // If remote branch already exists, let's advance it slightly if main is ahead, or keep it synced
  const localMain = state.branches[branchName] || state.branches['main'];
  const currentRemote = state.remotes[remoteRef] || { name: remoteRef, targetHash: 'C0' };

  const newRemotes = {
    ...state.remotes,
    [remoteRef]: {
      name: remoteRef,
      targetHash: localMain ? localMain.targetHash : currentRemote.targetHash,
    },
  };

  return {
    state: { ...state, remotes: newRemotes },
    output: [
      `From https://github.com/committree/simulator-repo`,
      ` * [new branch]      ${branchName}     -> ${remoteRef}`,
    ],
  };
}

function handlePull(state: GitState, args: string[]): GitCommandResult {
  const remoteName = args[0] || 'origin';
  const branchName = args[1] || state.activeBranch || 'main';
  const remoteRef = `${remoteName}/${branchName}`;

  const fetchRes = handleFetch(state, [remoteName, branchName]);
  return handleMerge(fetchRes.state, [remoteRef]);
}

function handlePush(state: GitState, args: string[]): GitCommandResult {
  const activeBranch = state.activeBranch;
  if (!activeBranch) {
    return { state, output: [], error: 'error: You are not currently on a branch. Switch to a branch to push.' };
  }

  const remoteName = args[0] || 'origin';
  const branchName = args[1] || activeBranch;
  const remoteRef = `${remoteName}/${branchName}`;

  const localBranch = state.branches[activeBranch];
  const newRemotes = {
    ...state.remotes,
    [remoteRef]: {
      name: remoteRef,
      targetHash: localBranch.targetHash,
    },
  };

  return {
    state: { ...state, remotes: newRemotes },
    output: [
      `Enumerating objects: 5, done.`,
      `Writing objects: 100% (5/5), 450 bytes | 450.00 KiB/s, done.`,
      `To https://github.com/committree/simulator-repo`,
      `   ${state.remotes[remoteRef]?.targetHash || 'C0'}..${localBranch.targetHash}  ${activeBranch} -> ${branchName}`,
    ],
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

  if (state.stash && state.stash.length > 0) {
    output.push(`\nYou have ${state.stash.length} stashed item(s). Run 'git stash list' to view.`);
  }

  return { state, output };
}
