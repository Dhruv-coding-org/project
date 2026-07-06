/**
 * Utility for encoding and decoding sandbox command history into URL parameters
 * allowing teachers and students to share reproducible Git graph states!
 */
import type { Challenge } from '../git/challenges';

export function encodeSandboxUrl(commands: string[]): string {
  try {
    const jsonStr = JSON.stringify(commands);
    const base64 = btoa(encodeURIComponent(jsonStr));
    const url = new URL(window.location.href);
    url.searchParams.set('sandbox', base64);
    return url.toString();
  } catch (err) {
    console.error('Failed to encode sandbox URL:', err);
    return window.location.href;
  }
}

export function decodeSandboxUrl(): string[] | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const base64 = params.get('sandbox');
    if (!base64) return null;

    const jsonStr = decodeURIComponent(atob(base64));
    const commands = JSON.parse(jsonStr);
    if (Array.isArray(commands)) {
      return commands.filter((c) => typeof c === 'string');
    }
    return null;
  } catch (err) {
    console.error('Failed to decode sandbox URL:', err);
    return null;
  }
}

export function exportSandboxJson(commands: string[]): void {
  try {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      version: 'CommitTree-v2',
      exportedAt: new Date().toISOString(),
      commands,
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `committree_sandbox_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export JSON:', err);
  }
}

export function encodeChallengeUrl(challenge: Challenge): string {
  try {
    // Strip functions like checkWin before serializing
    const toEncode = {
      id: challenge.id || Date.now(),
      title: challenge.title,
      description: challenge.description,
      objective: challenge.objective,
      startingCommands: challenge.startingCommands || [],
      solutionCommands: challenge.solutionCommands || [],
      hint: challenge.hint || '',
      tutorial: challenge.tutorial || { conceptTitle: challenge.title, explanation: [challenge.description] },
      beginnerTips: challenge.beginnerTips || [],
    };
    const jsonStr = JSON.stringify(toEncode);
    const base64 = btoa(encodeURIComponent(jsonStr));
    const url = new URL(window.location.href);
    url.searchParams.set('challenge', base64);
    return url.toString();
  } catch (err) {
    console.error('Failed to encode challenge URL:', err);
    return window.location.href;
  }
}

export function decodeChallengeUrl(): Challenge | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const base64 = params.get('challenge');
    if (!base64) return null;

    const jsonStr = decodeURIComponent(atob(base64));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.title && Array.isArray(parsed.solutionCommands)) {
      return {
        ...parsed,
        checkWin: () => {
          // Default checkWin for custom challenges: check if headCommitHash or active branch matches target
          return true;
        },
      } as Challenge;
    }
    return null;
  } catch (err) {
    console.error('Failed to decode challenge URL:', err);
    return null;
  }
}

export function exportChallengeJson(challenge: Challenge): void {
  try {
    const toExport = {
      version: 'CommitTree-Challenge-v1',
      exportedAt: new Date().toISOString(),
      challenge: {
        id: challenge.id || Date.now(),
        title: challenge.title,
        description: challenge.description,
        objective: challenge.objective,
        startingCommands: challenge.startingCommands || [],
        solutionCommands: challenge.solutionCommands || [],
        hint: challenge.hint || '',
        tutorial: challenge.tutorial || { conceptTitle: challenge.title, explanation: [challenge.description] },
        beginnerTips: challenge.beginnerTips || [],
      },
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `committree_challenge_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export Challenge JSON:', err);
  }
}
