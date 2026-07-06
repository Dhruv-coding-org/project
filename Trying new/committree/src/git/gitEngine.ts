import { getSimulatedDiffs, getSimulatedFileContent } from './simulatedRepo';

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

export interface MergeConflict {
  branchA: string;
  branchB: string;
  file: string;
  contentA: string;
  contentB: string;
}

export interface InteractiveRebaseCommit {
  hash: string;
  message: string;
  action: 'pick' | 'reword' | 'squash' | 'drop' | 'edit';
  originalHash: string;
}

export interface InteractiveRebaseState {
  targetHash: string;
  targetBranch: string;
  commits: InteractiveRebaseCommit[];
}

export interface BisectState {
  active: boolean;
  badHash: string | null;
  goodHash: string | null;
  currentHash: string | null;
  candidates: string[];
  step: number;
  bugHash: string;
  status: 'searching' | 'found' | 'none';
}

export interface StashEntry {
  id: string;
  message: string;
  branch: string;
  headCommit: string;
  date: string;
}

export interface ReflogEntry {
  id: string;
  index: number;
  hash: string;
  action: string;
  message: string;
  timestamp: string;
}

export interface GitState {
  commits: { [hash: string]: Commit };
  branches: { [name: string]: Branch };
  activeBranch: string | null; // null if detached HEAD
  headCommitHash: string;
  commitCounter: number;
  tags: { [name: string]: string }; // Map tag name to commit hash
  stash: string[]; // Stack of stashed work descriptions
  stashEntries?: StashEntry[]; // Structured stash cards
  remotes: { [name: string]: Branch }; // Simulated remote tracking branches (e.g. origin/main)
  stagedFiles?: string[];
  modifiedFiles?: string[];
  config?: { [key: string]: string };
  reflog?: string[];
  reflogEntries?: ReflogEntry[];
  activeConflict?: MergeConflict;
  activeRebase?: InteractiveRebaseState;
  bisect?: BisectState;
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
  stashEntries: [],
  remotes: {
    'origin/main': {
      name: 'origin/main',
      targetHash: 'C0',
    },
  },
  stagedFiles: [],
  modifiedFiles: ['index.html', 'styles.css', 'app.js', 'README.md'],
  config: { 'user.name': 'Dhruv', 'user.email': 'dhruv@committree.git' },
  reflog: ['C0 HEAD@{0}: commit (initial): Initial commit'],
  reflogEntries: [
    {
      id: 'ref-0',
      index: 0,
      hash: 'C0',
      action: 'commit (initial)',
      message: 'Initial commit',
      timestamp: 'just now',
    },
  ],
};

export function recordReflog(state: GitState, action: string, message: string, targetHash?: string): GitState {
  const hash = targetHash || state.headCommitHash;
  const oldEntries = state.reflogEntries || [];
  
  // Re-index old entries
  const shiftedOld = oldEntries.map((e, idx) => ({ ...e, index: idx + 1 }));
  
  const newEntry: ReflogEntry = {
    id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    index: 0,
    hash,
    action,
    message,
    timestamp: new Date().toLocaleTimeString(),
  };

  const nextEntries = [newEntry, ...shiftedOld].slice(0, 50); // keep max 50 entries
  const nextReflogStr = nextEntries.map((e) => `${e.hash} HEAD@{${e.index}}: ${e.action}: ${e.message}`);

  return {
    ...state,
    reflogEntries: nextEntries,
    reflog: nextReflogStr,
  };
}

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

export function resolveRef(state: GitState, ref: string): string | null {
  if (!ref) return null;
  if (ref === 'HEAD') return state.headCommitHash;
  if (ref.startsWith('HEAD~')) {
    const num = parseInt(ref.replace('HEAD~', ''), 10);
    if (isNaN(num)) return null;
    let curr: string | null = state.headCommitHash;
    for (let i = 0; i < num; i++) {
      if (curr && state.commits[curr] && state.commits[curr].parents.length > 0) {
        curr = state.commits[curr].parents[0];
      } else {
        return null;
      }
    }
    return curr;
  }
  if (ref.startsWith('HEAD@{') && ref.endsWith('}')) {
    const idxStr = ref.slice(6, -1);
    const idx = parseInt(idxStr, 10);
    if (!isNaN(idx) && state.reflogEntries && state.reflogEntries[idx]) {
      return state.reflogEntries[idx].hash;
    }
    if (!isNaN(idx) && state.reflog && state.reflog[idx]) {
      const match = state.reflog[idx].match(/^(\S+)\s+HEAD@\{/);
      if (match && match[1]) return match[1];
    }
    return null;
  }
  if (state.branches[ref]) return state.branches[ref].targetHash;
  if (state.remotes[ref]) return state.remotes[ref].targetHash;
  if (state.tags[ref]) return state.tags[ref];
  if (state.commits[ref]) return ref;
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
  const firstWord = parts[0]?.toLowerCase();

  if (firstWord === 'clear') {
    return { state, output: ['Console cleared.'], error: undefined };
  }
  if (firstWord === 'help') {
    return { state, output: ['Usage: git <command> [<args>]', '', 'Available commands in this simulator:', '  init, add, status, commit, branch, checkout, switch, merge, rebase, bisect, cherry-pick, reset, restore, tag, stash, revert, fetch, pull, push, log, diff, show, clone, config, reflog, rm, remote, blame'] };
  }

  const gitSubcommands = ['init', 'add', 'status', 'commit', 'branch', 'checkout', 'switch', 'merge', 'rebase', 'bisect', 'cherry-pick', 'reset', 'restore', 'tag', 'stash', 'revert', 'fetch', 'pull', 'push', 'log', 'diff', 'show', 'clone', 'config', 'reflog', 'rm', 'remote', 'blame'];

  if (firstWord !== 'git') {
    if (gitSubcommands.includes(firstWord)) {
      return { state, output: [], error: `"${firstWord}" is a git command. Try typing: git ${commandStr}` };
    }
    return { state, output: [], error: `Unknown command: "${parts[0]}". Please start your commands with "git ".` };
  }

  const action = parts[1]?.toLowerCase();
  if (!action) {
    return { state, output: ['Usage: git <command> [<args>]', '', 'Available commands in this simulator:', '  init, add, status, commit, branch, checkout, switch, merge, rebase, bisect, cherry-pick, reset, restore, tag, stash, revert, fetch, pull, push, log, diff, show, clone, config, reflog, rm, remote, blame'] };
  }

  let res: GitCommandResult;
  switch (action) {
    case 'commit':
      res = handleCommit(state, parts.slice(2)); break;
    case 'branch':
      res = handleBranch(state, parts.slice(2)); break;
    case 'checkout':
    case 'switch':
      res = handleCheckout(state, parts.slice(2)); break;
    case 'merge':
      res = handleMerge(state, parts.slice(2)); break;
    case 'rebase':
      res = handleRebase(state, parts.slice(2)); break;
    case 'bisect':
      res = handleBisect(state, parts.slice(2)); break;
    case 'cherry-pick':
      res = handleCherryPick(state, parts.slice(2)); break;
    case 'reset':
      res = handleReset(state, parts.slice(2)); break;
    case 'tag':
      res = handleTag(state, parts.slice(2)); break;
    case 'stash':
      res = handleStash(state, parts.slice(2)); break;
    case 'revert':
      res = handleRevert(state, parts.slice(2)); break;
    case 'fetch':
      res = handleFetch(state, parts.slice(2)); break;
    case 'pull':
      res = handlePull(state, parts.slice(2)); break;
    case 'push':
      res = handlePush(state, parts.slice(2)); break;
    case 'log':
      res = handleLog(state); break;
    case 'status':
      res = handleStatus(state); break;
    case 'init':
      res = handleInit(state); break;
    case 'add':
      res = handleAdd(state, parts.slice(2)); break;
    case 'diff':
      res = handleDiff(state, parts.slice(2)); break;
    case 'clone':
      res = handleClone(state, parts.slice(2)); break;
    case 'config':
      res = handleConfig(state, parts.slice(2)); break;
    case 'restore':
      res = handleRestore(state, parts.slice(2)); break;
    case 'rm':
    case 'mv':
      res = handleRm(state, action, parts.slice(2)); break;
    case 'show':
      res = handleShow(state, parts.slice(2)); break;
    case 'reflog':
      res = handleReflog(state); break;
    case 'remote':
      res = handleRemote(state, parts.slice(2)); break;
    case 'blame':
      res = handleBlame(state, parts.slice(2)); break;
    default:
      return { state, output: [], error: `git command "${action}" is not supported yet.` };
  }

  if (!res.error && res.state.headCommitHash !== state.headCommitHash) {
    let actionDesc: string = action;
    let msgDesc = `moving to ${res.state.headCommitHash}`;
    if (action === 'commit') {
      actionDesc = 'commit';
      msgDesc = res.state.commits[res.state.headCommitHash]?.message || 'commit';
    } else if (action === 'checkout' || action === 'switch') {
      actionDesc = 'checkout';
      msgDesc = `moving from ${state.activeBranch || state.headCommitHash} to ${res.state.activeBranch || res.state.headCommitHash}`;
    } else if (action === 'reset') {
      actionDesc = 'reset';
      msgDesc = `moving to ${parts.slice(2).join(' ') || 'HEAD'}`;
    } else if (action === 'merge') {
      actionDesc = 'merge';
      msgDesc = `merge ${parts[2] || ''}: ${res.state.commits[res.state.headCommitHash]?.message || 'Merge made'}`;
    } else if (action === 'rebase') {
      actionDesc = 'rebase finished';
      msgDesc = `returning to refs/heads/${res.state.activeBranch || 'HEAD'}`;
    } else if (action === 'cherry-pick') {
      actionDesc = 'cherry-pick';
      msgDesc = res.state.commits[res.state.headCommitHash]?.message || 'cherry-pick';
    } else if (action === 'revert') {
      actionDesc = 'revert';
      msgDesc = res.state.commits[res.state.headCommitHash]?.message || 'revert';
    }
    res.state = recordReflog(res.state, actionDesc, msgDesc);
  }

  return res;
}

function handleCommit(state: GitState, args: string[]): GitCommandResult {
  let message = 'Update';
  const mIndex = args.indexOf('-m');
  if (mIndex !== -1 && args[mIndex + 1]) {
    const msgArg = args.slice(mIndex + 1).join(' ');
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
        stagedFiles: [],
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
      stagedFiles: [],
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

  const isConflictSim = args.includes('--conflict') || args.includes('-c') || targetBranchName.toLowerCase().includes('conflict') || state.config?.['sim.conflict'] === 'true';
  if (isConflictSim && lca !== targetHash && lca !== headHash) {
    return {
      state: {
        ...state,
        activeConflict: {
          branchA: activeBranch,
          branchB: targetBranchName,
          file: 'index.html',
          contentA: '<div class="git-hero-badge">CommitTree Simulator v2</div>\n<button id="submit-commit">Execute Command</button>',
          contentB: '<div class="git-hero-badge">CommitTree Grandmaster v3</div>\n<button id="quick-action">Instant Run</button>',
        },
      },
      output: [
        `Auto-merging index.html`,
        `CONFLICT (content): Merge conflict in index.html`,
        `Automatic merge failed; fix conflicts and then commit the result.`,
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

  if (args[0] === '-i' || args[0] === '--interactive') {
    const targetArg = args[1] || 'HEAD~1';
    const targetHash = resolveRef(state, targetArg);
    if (!targetHash || !state.commits[targetHash]) {
      return { state, output: [], error: `rebase -i: target '${targetArg}' not found or invalid.` };
    }
    const headHash = state.headCommitHash;
    const lca = findLCA(state.commits, headHash, targetHash) || targetHash;
    if (lca === headHash) {
      return { state, output: ['Current branch is up to date. Nothing to rebase interactively.'] };
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
    if (commitsToRebase.length === 0) {
      return { state, output: ['No commits found to rebase.'] };
    }
    const interactiveCommits: InteractiveRebaseCommit[] = commitsToRebase.map(c => ({
      hash: c.hash,
      message: c.message,
      action: 'pick',
      originalHash: c.hash,
    }));
    return {
      state: {
        ...state,
        activeRebase: {
          targetHash: lca,
          targetBranch: targetArg,
          commits: interactiveCommits,
        },
      },
      output: [
        `Entering interactive rebase studio for target ${targetArg} (${lca})...`,
        `Reorder, squash, reword, or drop commits in the studio popup above!`,
      ],
    };
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

export function executeInteractiveRebase(state: GitState, rebaseState: InteractiveRebaseState): GitCommandResult {
  const activeBranch = state.activeBranch || 'HEAD';
  let currentParentHash = rebaseState.targetHash;
  let counter = state.commitCounter;
  const updatedCommits = { ...state.commits };
  const output: string[] = ['Executing interactive rebase...'];

  let lastCreatedHash: string | null = null;

  for (const item of rebaseState.commits) {
    if (item.action === 'drop') {
      output.push(`Dropped commit ${item.originalHash} (${item.message})`);
      continue;
    }
    if (item.action === 'squash') {
      if (!lastCreatedHash || !updatedCommits[lastCreatedHash]) {
        output.push(`Cannot squash ${item.originalHash} without a previous commit. Picking instead.`);
      } else {
        const prev = updatedCommits[lastCreatedHash];
        updatedCommits[lastCreatedHash] = {
          ...prev,
          message: `${prev.message}\n\nSquashed: ${item.message}`,
        };
        output.push(`Squashed ${item.originalHash} into ${lastCreatedHash}`);
        continue;
      }
    }

    counter += 1;
    const rebasedHash = `C${counter}'`;
    const origCommit = state.commits[item.originalHash] || { author: 'git@committree', isMerge: false };
    const finalMsg = item.action === 'reword' || item.action === 'edit' ? item.message : (state.commits[item.originalHash]?.message || item.message);

    const newCommit: Commit = {
      hash: rebasedHash,
      parents: [currentParentHash],
      message: finalMsg,
      branch: activeBranch,
      isMerge: origCommit.isMerge || false,
      isRebasedCopy: true,
      author: origCommit.author || 'git@committree',
      date: new Date().toLocaleTimeString(),
    };

    updatedCommits[rebasedHash] = newCommit;
    currentParentHash = rebasedHash;
    lastCreatedHash = rebasedHash;
    output.push(`Applied: [${rebasedHash}] ${finalMsg} (${item.action})`);
  }

  const newBranches = { ...state.branches };
  if (state.activeBranch && newBranches[state.activeBranch]) {
    newBranches[state.activeBranch] = {
      ...newBranches[state.activeBranch],
      targetHash: currentParentHash,
    };
  }

  return {
    state: {
      ...state,
      commits: updatedCommits,
      branches: newBranches,
      headCommitHash: currentParentHash,
      commitCounter: counter,
      activeRebase: undefined,
    },
    output: [
      ...output,
      `Successfully rebased and updated refs/heads/${activeBranch}.`,
    ],
  };
}

function handleBisect(state: GitState, args: string[]): GitCommandResult {
  const sub = args[0] || '';
  if (sub === 'start') {
    const allCommits = Object.keys(state.commits);
    const bugHash = allCommits.length > 2 ? allCommits[Math.floor(allCommits.length / 2)] : (allCommits[0] || 'C0');
    return {
      state: {
        ...state,
        bisect: {
          active: true,
          badHash: null,
          goodHash: null,
          currentHash: state.headCommitHash,
          candidates: allCommits,
          step: 0,
          bugHash,
          status: 'searching',
        },
      },
      output: [
        'Bisecting started. A secret bug has been hidden in your commit chain!',
        'Use "git bisect bad [<commit>]" to mark known buggy commits, and "git bisect good [<commit>]" for working ones.',
      ],
    };
  }

  if (sub === 'reset') {
    if (!state.bisect?.active) {
      return { state, output: ['Bisect is not currently active.'] };
    }
    const targetBranch = state.branches['main'] ? 'main' : Object.keys(state.branches)[0] || 'main';
    const targetHash = state.branches[targetBranch]?.targetHash || state.headCommitHash;
    return {
      state: {
        ...state,
        activeBranch: targetBranch,
        headCommitHash: targetHash,
        bisect: undefined,
      },
      output: ['Bisect reset. Returned to branch ' + targetBranch + '.'],
    };
  }

  if (sub === 'bad' || sub === 'good') {
    if (!state.bisect?.active) {
      return { state, output: [], error: 'You need to start by "git bisect start".' };
    }
    const targetRef = args[1] || 'HEAD';
    const targetHash = resolveRef(state, targetRef);
    if (!targetHash || !state.commits[targetHash]) {
      return { state, output: [], error: `bisect: '${targetRef}' is not a valid commit.` };
    }

    const nextBisect = { ...state.bisect };
    if (sub === 'bad') nextBisect.badHash = targetHash;
    if (sub === 'good') nextBisect.goodHash = targetHash;

    if (nextBisect.badHash && nextBisect.goodHash) {
      // Find ancestors of badHash that are NOT ancestors of goodHash
      const badAncestors = getAncestors(state.commits, nextBisect.badHash);
      const goodAncestors = getAncestors(state.commits, nextBisect.goodHash);
      const candidates: string[] = [];
      for (const h of badAncestors) {
        if (!goodAncestors.has(h) && h !== nextBisect.goodHash) {
          candidates.push(h);
        }
      }

      nextBisect.candidates = candidates;
      nextBisect.step += 1;

      if (candidates.length <= 1) {
        const culprit = candidates[0] || nextBisect.badHash;
        nextBisect.status = 'found';
        nextBisect.currentHash = culprit;
        return {
          state: {
            ...state,
            headCommitHash: culprit,
            activeBranch: null,
            bisect: nextBisect,
          },
          output: [
            `Bisect complete! Found the first bad commit: [${culprit}] ${state.commits[culprit]?.message || ''}`,
            `The bug was trapped in 2^${nextBisect.step} binary search steps!`,
          ],
        };
      }

      // Pick midpoint
      const mid = candidates[Math.floor(candidates.length / 2)];
      nextBisect.currentHash = mid;
      return {
        state: {
          ...state,
          headCommitHash: mid,
          activeBranch: null,
          bisect: nextBisect,
        },
        output: [
          `Bisecting: ${candidates.length} revisions left to test after this (roughly ${Math.ceil(Math.log2(candidates.length))} steps)`,
          `[${mid}] ${state.commits[mid]?.message || ''}`,
        ],
      };
    }

    return {
      state: { ...state, bisect: nextBisect },
      output: [`Marked ${targetHash} as ${sub}. Waiting for ${sub === 'bad' ? 'good' : 'bad'} commit to begin binary division...`],
    };
  }

  return { state, output: [], error: `bisect: subcommand '${sub}' not recognized. Use start, bad, good, or reset.` };
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

export function applyStashEntry(state: GitState, idx: number, drop: boolean): GitCommandResult {
  const stashList = state.stash || [];
  const entriesList = state.stashEntries || [];
  if (idx < 0 || idx >= stashList.length) {
    return { state, output: [], error: `Stash entry stash@{${idx}} not found.` };
  }
  const popped = stashList[idx];
  const newStash = drop ? stashList.filter((_, i) => i !== idx) : stashList;
  const newEntries = drop ? entriesList.filter((_, i) => i !== idx) : entriesList;
  return {
    state: { ...state, stash: newStash, stashEntries: newEntries },
    output: [
      `Applied stash: ${popped}`,
      drop ? `Dropped refs/stash@{${idx}} (${popped})` : `Kept stash entry.`,
    ],
  };
}

export function branchFromStashEntry(state: GitState, idx: number, branchName: string): GitCommandResult {
  const entriesList = state.stashEntries || [];
  const stashList = state.stash || [];
  if (idx < 0 || idx >= stashList.length) {
    return { state, output: [], error: `Stash entry stash@{${idx}} not found.` };
  }
  if (!branchName) {
    return { state, output: [], error: `Please provide a branch name for git stash branch.` };
  }
  if (state.branches[branchName]) {
    return { state, output: [], error: `fatal: A branch named '${branchName}' already exists.` };
  }

  const entry = entriesList[idx];
  const targetHash = entry ? entry.headCommit : state.headCommitHash;

  const newBranches = {
    ...state.branches,
    [branchName]: { name: branchName, targetHash },
  };

  const popped = stashList[idx];
  const newStash = stashList.filter((_, i) => i !== idx);
  const newEntries = entriesList.filter((_, i) => i !== idx);

  return {
    state: {
      ...state,
      branches: newBranches,
      activeBranch: branchName,
      headCommitHash: targetHash,
      stash: newStash,
      stashEntries: newEntries,
    },
    output: [
      `Switched to a new branch '${branchName}' at commit ${targetHash}`,
      `Applied stash: ${popped}`,
      `Dropped refs/stash@{${idx}} (${popped})`,
    ],
  };
}

function handleStash(state: GitState, args: string[]): GitCommandResult {
  const subAction = args[0] || 'push';
  const stashList = state.stash || [];
  const entriesList = state.stashEntries || [];

  if (subAction === 'list') {
    if (stashList.length === 0) {
      return { state, output: ['No stashed changes found.'] };
    }
    return {
      state,
      output: stashList.map((item, idx) => `stash@{${idx}}: ${item}`),
    };
  }

  if (subAction === 'branch') {
    const branchName = args[1];
    if (!branchName) return { state, output: [], error: 'Usage: git stash branch <branchname> [<stash>]' };
    let idx = 0;
    if (args[2] && args[2].startsWith('stash@{') && args[2].endsWith('}')) {
      idx = parseInt(args[2].slice(7, -1), 10) || 0;
    }
    return branchFromStashEntry(state, idx, branchName);
  }

  if (subAction === 'pop' || subAction === 'apply' || subAction === 'drop') {
    if (stashList.length === 0) {
      return { state, output: [], error: 'No stash entries found.' };
    }
    let idx = 0;
    const targetArg = args[1];
    if (targetArg && targetArg.startsWith('stash@{') && targetArg.endsWith('}')) {
      idx = parseInt(targetArg.slice(7, -1), 10) || 0;
    }
    if (subAction === 'drop') {
      const newStash = stashList.filter((_, i) => i !== idx);
      const newEntries = entriesList.filter((_, i) => i !== idx);
      return {
        state: { ...state, stash: newStash, stashEntries: newEntries },
        output: [`Dropped refs/stash@{${idx}} (${stashList[idx] || ''})`],
      };
    }
    return applyStashEntry(state, idx, subAction === 'pop');
  }

  // Push / save stash
  const desc = args.length > 0 && args[0] !== 'push' ? args.join(' ') : `WIP on ${state.activeBranch || 'detached HEAD'}: ${state.headCommitHash} ${state.commits[state.headCommitHash]?.message || ''}`;
  const newStash = [desc, ...stashList];
  const newEntry: StashEntry = {
    id: `stash-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    message: desc,
    branch: state.activeBranch || 'detached',
    headCommit: state.headCommitHash,
    date: new Date().toLocaleTimeString(),
  };
  const newEntries = [newEntry, ...entriesList];

  return {
    state: { ...state, stash: newStash, stashEntries: newEntries },
    output: [
      `Saved working directory and index state "${desc}"`,
      `HEAD is now at ${state.headCommitHash} ${state.commits[state.headCommitHash]?.message || ''}`,
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
    output.push(`On branch ${activeBranch}`);
  } else {
    output.push(`HEAD detached at ${state.headCommitHash}`);
  }

  const staged = state.stagedFiles || [];
  const modified = state.modifiedFiles || ['index.html', 'styles.css', 'app.js'];

  if (staged.length > 0) {
    output.push(`\nChanges to be committed:`, `  (use "git restore --staged <file>..." to unstage)`);
    staged.forEach(f => output.push(`        staged:     ${f}`));
  }

  if (modified.length > 0) {
    output.push(`\nChanges not staged for commit:`, `  (use "git add <file>..." to update what will be committed)`, `  (use "git restore <file>..." to discard changes in working directory)`);
    modified.forEach(f => output.push(`        modified:   ${f}`));
  }

  if (staged.length === 0 && modified.length === 0) {
    output.push(`Your branch is up to date with 'origin/${activeBranch || 'main'}'.`, `nothing to commit, working tree clean`);
  }

  if (state.stash && state.stash.length > 0) {
    output.push(`\nYou have ${state.stash.length} stashed item(s). Run 'git stash list' to view.`);
  }

  return { state, output };
}

function handleInit(state: GitState): GitCommandResult {
  return { state, output: ['Initialized empty Git repository in /workspace/.git/'] };
}

function handleAdd(state: GitState, args: string[]): GitCommandResult {
  const target = args[0] || '.';
  const staged = state.stagedFiles || [];
  const modified = state.modifiedFiles || ['index.html', 'styles.css', 'app.js', 'README.md'];
  let newStaged: string[];
  let newModified: string[];

  if (target === '.' || target === '-A' || target === '--all') {
    newStaged = Array.from(new Set([...staged, ...modified]));
    newModified = [];
  } else {
    newStaged = Array.from(new Set([...staged, target]));
    newModified = modified.filter(f => f !== target);
  }

  return {
    state: { ...state, stagedFiles: newStaged, modifiedFiles: newModified },
    output: target === '.' ? ['Staged all modified files (index.html, styles.css, app.js, README.md).'] : [`staged '${target}' for commit.`]
  };
}

function handleDiff(state: GitState, args: string[] = []): GitCommandResult {
  if (args.length >= 1) {
    const hashA = resolveRef(state, args[0]) || args[0];
    const hashB = args[1] ? (resolveRef(state, args[1]) || args[1]) : state.headCommitHash;
    const diffs = getSimulatedDiffs(state.commits, hashA, hashB);
    
    const output: string[] = [];
    for (const d of diffs) {
      output.push(`diff --git a/${d.path} b/${d.path}`);
      output.push(`index ${hashA}..${hashB} 100644`);
      output.push(`--- a/${d.path}`);
      output.push(`+++ b/${d.path}`);
      output.push(`@@ -1,3 +1,${d.lines.length} @@`);
      for (const l of d.lines) {
        if (l.type === 'add') output.push(`+${l.content}`);
        else if (l.type === 'del') output.push(`-${l.content}`);
        else output.push(` ${l.content}`);
      }
    }
    return { state, output: output.length > 0 ? output : ['No differences between revisions.'] };
  }

  const staged = state.stagedFiles || [];
  const modified = state.modifiedFiles || ['index.html', 'styles.css'];

  if (modified.length === 0 && staged.length === 0) {
    return { state, output: ['No differences found (working tree is clean).'] };
  }

  return {
    state,
    output: [
      `diff --git a/index.html b/index.html`,
      `index 83a4f1..19c82a 100644`,
      `--- a/index.html`,
      `+++ b/index.html`,
      `@@ -12,4 +12,8 @@`,
      `+ <div class="git-hero-badge">CommitTree Simulator v2</div>`,
      `+ <button id="submit-commit">Execute Command</button>`,
      `  <footer>© 2026 CommitTree</footer>`,
    ]
  };
}

function handleClone(state: GitState, args: string[]): GitCommandResult {
  const url = args[0] || 'https://github.com/committree/demo-repo.git';
  const repoName = url.split('/').pop()?.replace('.git', '') || 'demo-repo';
  return {
    state,
    output: [
      `Cloning into '${repoName}'...`,
      `remote: Enumerating objects: 24, done.`,
      `remote: Counting objects: 100% (24/24), done.`,
      `remote: Compressing objects: 100% (18/18), done.`,
      `Receiving objects: 100% (24/24), 14.20 KiB | 2.84 MiB/s, done.`,
      `Resolving deltas: 100% (6/6), done.`
    ]
  };
}

function handleConfig(state: GitState, args: string[]): GitCommandResult {
  const key = args[0] ? args[0].replace('--global', '').trim() : '';
  const val = args.slice(1).join(' ').replace(/^["']|["']$/g, '');

  if (!key) {
    return { state, output: ['user.name=Dhruv', 'user.email=dhruv@committree.git', 'core.editor=vscode', 'color.ui=auto'] };
  }

  const newConfig = { ...(state.config || { 'user.name': 'Dhruv', 'user.email': 'dhruv@committree.git' }) };
  if (val) {
    newConfig[key] = val;
    return { state: { ...state, config: newConfig }, output: [`Set global config '${key}' to '${val}'.`] };
  } else {
    return { state, output: [newConfig[key] || 'Not set'] };
  }
}

function handleRestore(state: GitState, args: string[]): GitCommandResult {
  const isStaged = args.includes('--staged');
  const target = args.filter(a => a !== '--staged')[0] || '.';

  if (isStaged) {
    const staged = state.stagedFiles || [];
    const newStaged = staged.filter(f => f !== target && target !== '.');
    const newModified = Array.from(new Set([...(state.modifiedFiles || []), target === '.' ? 'index.html' : target]));
    return {
      state: { ...state, stagedFiles: newStaged, modifiedFiles: newModified },
      output: [target === '.' ? 'Unstaged all files.' : `Unstaged '${target}' back to modified working tree.`]
    };
  } else {
    const modified = state.modifiedFiles || ['index.html', 'styles.css'];
    const newModified = modified.filter(f => f !== target && target !== '.');
    return {
      state: { ...state, modifiedFiles: newModified },
      output: [target === '.' ? 'Restored all working tree files to HEAD state.' : `Discarded local modifications in '${target}'.`]
    };
  }
}

function handleRm(state: GitState, action: string, args: string[]): GitCommandResult {
  const file = args[0] || 'old-script.js';
  return {
    state,
    output: [`${action} '${file}'`, `File scheduled for ${action === 'mv' ? 'rename' : 'deletion'} in next commit.`]
  };
}

function handleShow(state: GitState, args: string[]): GitCommandResult {
  const hash = args[0] || state.headCommitHash;
  const commit = state.commits[hash];
  if (!commit) {
    return { state, output: [], error: `fatal: bad object ${hash}` };
  }
  return {
    state,
    output: [
      `commit ${commit.hash}`,
      `Author: ${commit.author}`,
      `Date:   ${commit.date}`,
      ``,
      `    ${commit.message}`,
      ``,
      `diff --git a/src/main.ts b/src/main.ts`,
      `index 2a1d3f..9b8c7e 100644`,
      `--- a/src/main.ts`,
      `+++ b/src/main.ts`,
      `@@ -10,3 +10,6 @@`,
      `+ // Added by commit ${commit.hash}`,
      `+ console.log("Executing ${commit.message}");`
    ]
  };
}

function handleReflog(state: GitState): GitCommandResult {
  if (state.reflogEntries && state.reflogEntries.length > 0) {
    const logs = state.reflogEntries.map(e => `${e.hash} HEAD@{${e.index}}: ${e.action}: ${e.message}`);
    return { state, output: logs };
  }
  const logs = state.reflog || [
    `${state.headCommitHash} HEAD@{0}: commit: ${state.commits[state.headCommitHash]?.message || 'latest work'}`,
    `C0 HEAD@{1}: commit (initial): Initial commit`
  ];
  return { state, output: logs };
}

function handleRemote(state: GitState, args: string[]): GitCommandResult {
  const sub = args[0];
  const config = state.config || {};
  const remotes = { ...state.remotes };

  if (sub === '-v' || !sub) {
    const remoteNames = new Set<string>();
    for (const key of Object.keys(config)) {
      if (key.startsWith('remote.') && key.endsWith('.url')) {
        remoteNames.add(key.slice(7, -4));
      }
    }
    const output: string[] = [];
    for (const name of remoteNames) {
      const url = config[`remote.${name}.url`] || '';
      output.push(`${name}\t${url} (fetch)`);
      output.push(`${name}\t${url} (push)`);
    }
    if (output.length === 0) output.push('origin\thttps://github.com/committree/demo-repo.git (fetch)', 'origin\thttps://github.com/committree/demo-repo.git (push)');
    return { state, output };
  } else if (sub === 'add') {
    const name = args[1] || 'origin';
    const url = args[2] || 'https://github.com/committree/demo-repo.git';
    const newConfig = { ...config, [`remote.${name}.url`]: url };
    const trackingRef = `${name}/main`;
    if (!remotes[trackingRef]) {
      remotes[trackingRef] = { name: trackingRef, targetHash: state.headCommitHash };
    }
    return {
      state: { ...state, config: newConfig, remotes },
      output: [`Added remote '${name}' -> ${url}`],
    };
  } else if (sub === 'remove' || sub === 'rm') {
    const name = args[1];
    if (!name) return { state, output: [], error: 'usage: git remote remove <name>' };
    const newConfig = { ...config };
    delete newConfig[`remote.${name}.url`];
    for (const key of Object.keys(remotes)) {
      if (key.startsWith(`${name}/`)) {
        delete remotes[key];
      }
    }
    return {
      state: { ...state, config: newConfig, remotes },
      output: [`Removed remote '${name}'.`],
    };
  }
  return { state, output: [`Remote command '${args.join(' ')}' completed.`] };
}

function handleBlame(state: GitState, args: string[]): GitCommandResult {
  const file = args[0] || 'src/index.ts';
  const annotated = getSimulatedFileContent(state.commits, state.headCommitHash, file);
  const output = annotated.lines.map((line, idx) => {
    const ann = annotated.annotations[idx] || { hash: 'C0', author: 'root@committree', date: 'initial' };
    const hashBadge = ann.hash.padEnd(6);
    const authorBadge = `(${ann.author.padEnd(14)} ${ann.date.padEnd(10)})`;
    return `${hashBadge} ${authorBadge} ${line}`;
  });
  return { state, output };
}

export function resolveMergeConflict(state: GitState, resolvedContent: string): GitCommandResult {
  if (!state.activeConflict) {
    return { state, output: ['No active merge conflict to resolve.'] };
  }
  const { branchA, branchB, file } = state.activeConflict;
  const nextHash = getNextCommitHash(state);
  const lineCount = resolvedContent.split('\n').length;
  const mergeMsg = `Merge branch '${branchB}' into ${branchA} (resolved ${lineCount} lines in ${file})`;
  
  const targetBranch = state.branches[branchB] || state.remotes[branchB];
  const targetHash = targetBranch ? targetBranch.targetHash : state.headCommitHash;

  const mergeCommit: Commit = {
    hash: nextHash,
    parents: [state.headCommitHash, targetHash],
    message: mergeMsg,
    branch: branchA,
    isMerge: true,
    author: 'user@committree',
    date: new Date().toLocaleTimeString(),
  };

  const newCommits = { ...state.commits, [nextHash]: mergeCommit };
  const newBranches = {
    ...state.branches,
    [branchA]: {
      ...state.branches[branchA],
      targetHash: nextHash,
    },
  };

  const nextState: GitState = {
    ...state,
    commits: newCommits,
    branches: newBranches,
    headCommitHash: nextHash,
    commitCounter: state.commitCounter + 1,
  };
  delete nextState.activeConflict;

  return {
    state: nextState,
    output: [
      `Resolved merge conflict in '${file}'.`,
      `[${branchA} ${nextHash}] ${mergeMsg}`,
      ` 1 file changed, 2 insertions(+), 1 deletion(-)`,
    ],
  };
}

export interface PRMergeResult {
  state: GitState;
  output: string[];
  error?: string;
  newCommitHash?: string;
}

export function executePullRequestMerge(
  state: GitState,
  baseBranchName: string,
  compareBranchName: string,
  strategy: 'merge' | 'squash' | 'rebase',
  prTitle: string
): PRMergeResult {
  const baseBranch = state.branches[baseBranchName];
  const compareBranch = state.branches[compareBranchName];
  if (!baseBranch || !compareBranch) {
    return { state, output: [], error: 'Invalid base or compare branch selected.' };
  }

  const baseHash = baseBranch.targetHash;
  const compareHash = compareBranch.targetHash;

  if (baseHash === compareHash) {
    return { state, output: ['Branches are already identical. Nothing to merge.'] };
  }

  const baseAncestors = getAncestors(state.commits, baseHash);

  // Find commits on compare branch not reachable from base branch
  const uniqueCommits: Commit[] = [];
  const queue: string[] = [compareHash];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const currHash = queue.shift()!;
    if (visited.has(currHash) || baseAncestors.has(currHash)) continue;
    visited.add(currHash);
    const c = state.commits[currHash];
    if (c) {
      uniqueCommits.push(c);
      if (c.parents) queue.push(...c.parents);
    }
  }
  // Reverse so oldest is first
  uniqueCommits.reverse();

  let counter = state.commitCounter;
  const updatedCommits = { ...state.commits };
  const updatedBranches = { ...state.branches };
  const output: string[] = [`Executing Pull Request Merge (${strategy.toUpperCase()})...`];
  let newTipHash = baseHash;

  if (strategy === 'merge') {
    counter += 1;
    const mergeHash = `C${counter}`;
    const mergeCommit: Commit = {
      hash: mergeHash,
      parents: [baseHash, compareHash],
      message: `${prTitle} (from ${compareBranchName})`,
      branch: baseBranchName,
      isMerge: true,
      author: 'git@committree',
      date: 'just now',
    };
    updatedCommits[mergeHash] = mergeCommit;
    newTipHash = mergeHash;
    output.push(`Created merge commit ${mergeHash} connecting ${baseBranchName} and ${compareBranchName}.`);
  } else if (strategy === 'squash') {
    counter += 1;
    const squashHash = `C${counter}`;
    const squashedMessage = `${prTitle}\n\n` + (uniqueCommits.length > 0 ? uniqueCommits.map(c => `* ${c.message} (${c.hash})`).join('\n') : `* Squashed from ${compareBranchName}`);
    const squashCommit: Commit = {
      hash: squashHash,
      parents: [baseHash],
      message: squashedMessage,
      branch: baseBranchName,
      isMerge: false,
      author: 'git@committree',
      date: 'just now',
    };
    updatedCommits[squashHash] = squashCommit;
    newTipHash = squashHash;
    output.push(`Squashed ${uniqueCommits.length} commits into single new commit ${squashHash} on ${baseBranchName}.`);
  } else if (strategy === 'rebase') {
    let currentParent = baseHash;
    if (uniqueCommits.length === 0) {
      output.push(`No unique commits to rebase from ${compareBranchName}.`);
      newTipHash = baseHash;
    } else {
      for (const c of uniqueCommits) {
        counter += 1;
        const rebasedHash = `C${counter}'`;
        const rebasedCommit: Commit = {
          hash: rebasedHash,
          parents: [currentParent],
          message: `${c.message} (rebased)`,
          branch: baseBranchName,
          isMerge: false,
          author: c.author || 'git@committree',
          date: 'just now',
        };
        updatedCommits[rebasedHash] = rebasedCommit;
        currentParent = rebasedHash;
        output.push(`Rebased commit ${c.hash} -> ${rebasedHash}`);
      }
      newTipHash = currentParent;
    }
  }

  updatedBranches[baseBranchName] = {
    ...baseBranch,
    targetHash: newTipHash,
  };

  let nextState: GitState = {
    ...state,
    commits: updatedCommits,
    branches: updatedBranches,
    headCommitHash: state.activeBranch === baseBranchName ? newTipHash : state.headCommitHash,
    commitCounter: counter,
  };

  nextState = recordReflog(nextState, 'merge', `pr merge (${strategy}) from ${compareBranchName}`, newTipHash);

  return {
    state: nextState,
    output,
    newCommitHash: newTipHash,
  };
}

