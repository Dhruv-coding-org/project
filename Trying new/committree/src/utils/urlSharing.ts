/**
 * Utility for encoding and decoding sandbox command history into URL parameters
 * allowing teachers and students to share reproducible Git graph states!
 */

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
