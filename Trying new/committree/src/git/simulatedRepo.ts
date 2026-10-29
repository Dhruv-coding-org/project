import type { Commit } from './gitEngine';

export interface SimulatedFile {
  path: string;
  name: string;
  language: string;
  initialContent: string[];
}

export const SIMULATED_FILES: SimulatedFile[] = [
  {
    path: 'src/index.ts',
    name: 'index.ts',
    language: 'typescript',
    initialContent: [
      '// CommitTree Application Bootstrap',
      'import { initEngine } from "./engine";',
      'import { setupUI } from "./ui";',
      '',
      'const app = initEngine({ mode: "production" });',
      'setupUI(app);',
      '',
      'console.log("CommitTree engine started successfully.");',
    ],
  },
  {
    path: 'src/auth.ts',
    name: 'auth.ts',
    language: 'typescript',
    initialContent: [
      '// User Authentication & Session Manager',
      'export interface UserSession {',
      '  userId: string;',
      '  role: "admin" | "developer" | "guest";',
      '}',
      '',
      'export function getSession(): UserSession {',
      '  return { userId: "anon", role: "guest" };',
      '}',
    ],
  },
  {
    path: 'src/components/App.tsx',
    name: 'App.tsx',
    language: 'typescript',
    initialContent: [
      'import React from "react";',
      '',
      'export const App: React.FC = () => {',
      '  return (',
      '    <div className="app-container">',
      '      <header><h1>CommitTree Workspace</h1></header>',
      '      <main>Welcome to interactive Git simulation.</main>',
      '    </div>',
      '  );',
      '};',
    ],
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    initialContent: [
      '# CommitTree Repository',
      '',
      'An interactive Git learning and simulation repository.',
      '',
      '## Getting Started',
      'Run `npm install` followed by `npm start` to launch.',
    ],
  },
  {
    path: 'package.json',
    name: 'package.json',
    language: 'json',
    initialContent: [
      '{',
      '  "name": "committree-sim-repo",',
      '  "version": "1.0.0",',
      '  "main": "src/index.ts",',
      '  "dependencies": {',
      '    "react": "^18.2.0"',
      '  }',
      '}',
    ],
  },
];

export interface LineAnnotation {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface AnnotatedFileContent {
  path: string;
  lines: string[];
  annotations: LineAnnotation[];
}

/**
 * Gets ancestry commit chain from C0 up to targetHash in chronological order.
 */
function getCommitChain(commits: { [hash: string]: Commit }, targetHash: string): Commit[] {
  const chain: Commit[] = [];
  let curr = targetHash;
  const visited = new Set<string>();

  while (curr && commits[curr] && !visited.has(curr)) {
    visited.add(curr);
    chain.push(commits[curr]);
    if (commits[curr].parents && commits[curr].parents.length > 0) {
      curr = commits[curr].parents[0];
    } else {
      break;
    }
  }

  return chain.reverse();
}

/**
 * Maps a commit to the simulated file path it likely touched based on its message or hash.
 */
function getTargetFileForCommit(commit: Commit): string {
  const msg = commit.message.toLowerCase();
  if (msg.includes('auth') || msg.includes('login') || msg.includes('user') || msg.includes('session')) {
    return 'src/auth.ts';
  }
  if (msg.includes('ui') || msg.includes('style') || msg.includes('comp') || msg.includes('header') || msg.includes('button')) {
    return 'src/components/App.tsx';
  }
  if (msg.includes('readme') || msg.includes('doc') || msg.includes('guide')) {
    return 'README.md';
  }
  if (msg.includes('pkg') || msg.includes('dep') || msg.includes('package') || msg.includes('install')) {
    return 'package.json';
  }
  return 'src/index.ts';
}

/**
 * Generates simulated code content and line-by-line blame annotations for a file at a specific commit hash.
 */
export function getSimulatedFileContent(
  commits: { [hash: string]: Commit },
  targetHash: string,
  filePath: string
): AnnotatedFileContent {
  const baseFile = SIMULATED_FILES.find((f) => f.path === filePath) || SIMULATED_FILES[0];
  const chain = getCommitChain(commits, targetHash);

  const lines: string[] = [...baseFile.initialContent];
  const initialCommit = chain[0] || commits['C0'] || { hash: 'C0', author: 'root@committree', date: 'initial', message: 'Initial commit' };
  
  const annotations: LineAnnotation[] = lines.map(() => ({
    hash: initialCommit.hash,
    author: initialCommit.author || 'root@committree',
    date: initialCommit.date || 'initial',
    message: initialCommit.message || 'Initial commit',
  }));

  // Apply simulated modifications as we walk down the commit chain
  for (let i = 1; i < chain.length; i++) {
    const c = chain[i];
    const touchedFile = getTargetFileForCommit(c);
    
    if (touchedFile === filePath || c.isMerge || c.message.toLowerCase().includes('all')) {
      const ann: LineAnnotation = {
        hash: c.hash,
        author: c.author || 'dev@committree',
        date: c.date || new Date().toLocaleTimeString(),
        message: c.message,
      };

      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const newCode = `// [Rev ${c.hash}] ${c.message}\nexport const feat_${c.hash.replace(/[^a-zA-Z0-9]/g, '')} = true;`;
        const splitNew = newCode.split('\n');
        lines.push(...splitNew);
        annotations.push(...splitNew.map(() => ann));
      } else if (filePath.endsWith('.md')) {
        const newCode = `\n- **Update (${c.hash})**: ${c.message}`;
        lines.push(newCode);
        annotations.push(ann);
      } else if (filePath.endsWith('.json')) {
        // Insert right before closing brace
        const insertIdx = Math.max(0, lines.length - 1);
        const newCode = `  ,"feature_${c.hash}": "${c.message}"`;
        lines.splice(insertIdx, 0, newCode);
        annotations.splice(insertIdx, 0, ann);
      }
    }
  }

  return { path: filePath, lines, annotations };
}

export interface DiffLine {
  type: 'context' | 'add' | 'del';
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

/**
 * Computes a simple Longest Common Subsequence (LCS) based diff between two line arrays.
 */
function computeLineDiff(oldLines: string[], newLines: string[]): { additions: number; deletions: number; lines: DiffLine[] } {
  const m = oldLines.length;
  const n = newLines.length;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diffLines: DiffLine[] = [];
  let i = m;
  let j = n;
  let additions = 0;
  let deletions = 0;

  const revLines: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      revLines.push({ type: 'context', content: oldLines[i - 1], oldLine: i, newLine: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      revLines.push({ type: 'add', content: newLines[j - 1], newLine: j });
      additions++;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      revLines.push({ type: 'del', content: oldLines[i - 1], oldLine: i });
      deletions++;
      i--;
    }
  }

  revLines.reverse().forEach((l) => diffLines.push(l));
  return { additions, deletions, lines: diffLines };
}

/**
 * Generates diff comparison across all simulated files between two commit hashes.
 */
export function getSimulatedDiffs(
  commits: { [hash: string]: Commit },
  hashA: string,
  hashB: string,
  targetFilePath?: string
): FileDiff[] {
  const filesToDiff = targetFilePath
    ? SIMULATED_FILES.filter((f) => f.path === targetFilePath)
    : SIMULATED_FILES;

  const results: FileDiff[] = [];

  for (const file of filesToDiff) {
    const contentA = getSimulatedFileContent(commits, hashA, file.path);
    const contentB = getSimulatedFileContent(commits, hashB, file.path);

    const diff = computeLineDiff(contentA.lines, contentB.lines);
    if (diff.additions > 0 || diff.deletions > 0 || targetFilePath) {
      results.push({
        path: file.path,
        additions: diff.additions,
        deletions: diff.deletions,
        lines: diff.lines,
      });
    }
  }

  if (results.length === 0 && !targetFilePath) {
    // If identical, return at least index.ts with context
    const contentA = getSimulatedFileContent(commits, hashA, 'src/index.ts');
    const diff = computeLineDiff(contentA.lines, contentA.lines);
    results.push({
      path: 'src/index.ts',
      additions: 0,
      deletions: 0,
      lines: diff.lines,
    });
  }

  return results;
}
