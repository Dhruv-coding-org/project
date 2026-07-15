/**
 * subtitleParser.ts — Lightweight SRT / WebVTT parser
 *
 * Accepts the raw text content of a .srt or .vtt file and returns
 * an array of SubtitleCue objects with times in seconds.
 */

export interface SubtitleCue {
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

/**
 * Convert a timestamp string like "01:23:45,678" or "01:23:45.678"
 * to total seconds.  Also handles the short form "MM:SS,mmm".
 */
function parseTimestamp(raw: string): number {
  const cleaned = raw.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    return (
      parseInt(parts[0], 10) * 3600 +
      parseInt(parts[1], 10) * 60 +
      parseFloat(parts[2])
    );
  }
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Parse raw .srt or .vtt text into an array of cues.
 *
 * Handles:
 *  - WEBVTT header (ignored)
 *  - Numeric cue indices (ignored)
 *  - Timestamps with commas (SRT) or dots (VTT)
 *  - Multi-line cue text
 *  - Basic HTML tags like <i>, <b> are preserved for rendering
 */
export function parseSubtitles(rawText: string): SubtitleCue[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const cues: SubtitleCue[] = [];

  const timeRegex =
    /(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})/;

  let currentCue: Partial<SubtitleCue> = {};
  let textLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip WEBVTT header, NOTE blocks, STYLE blocks
    if (line === 'WEBVTT' || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    const match = line.match(timeRegex);

    if (match) {
      // Flush previous cue if any
      if (currentCue.startTime !== undefined && textLines.length > 0) {
        currentCue.text = textLines.join('\n');
        cues.push(currentCue as SubtitleCue);
        textLines = [];
      }
      currentCue = {
        startTime: parseTimestamp(match[1]),
        endTime: parseTimestamp(match[2]),
      };
    } else if (line === '' && currentCue.startTime !== undefined) {
      // Blank line = end of cue
      if (textLines.length > 0) {
        currentCue.text = textLines.join('\n');
        cues.push(currentCue as SubtitleCue);
        currentCue = {};
        textLines = [];
      }
    } else if (line !== '' && currentCue.startTime !== undefined) {
      // Skip pure-numeric lines (SRT cue indices)
      if (/^\d+$/.test(line)) continue;
      textLines.push(line);
    }
  }

  // Flush last cue
  if (currentCue.startTime !== undefined && textLines.length > 0) {
    currentCue.text = textLines.join('\n');
    cues.push(currentCue as SubtitleCue);
  }

  return cues;
}

/**
 * Binary-search the cues array for the active cue at a given time.
 * Returns the cue text or empty string.
 */
export function getActiveCueText(cues: SubtitleCue[], time: number): string {
  if (cues.length === 0) return '';

  let lo = 0;
  let hi = cues.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cue = cues[mid];

    if (time < cue.startTime) {
      hi = mid - 1;
    } else if (time > cue.endTime) {
      lo = mid + 1;
    } else {
      return cue.text;
    }
  }

  return '';
}
