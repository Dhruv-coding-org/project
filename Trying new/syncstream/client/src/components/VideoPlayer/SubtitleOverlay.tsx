import type { SubtitleCue } from '../../utils/subtitleParser';
import { getActiveCueText } from '../../utils/subtitleParser';

interface SubtitleOverlayProps {
  cues: SubtitleCue[];
  currentTime: number;
  visible: boolean;
  liveAutoCaptionText?: string;
  fontSize?: 'sm' | 'md' | 'lg';
}

/**
 * Securely sanitizes subtitle text using native DOMParser DOM traversal.
 * Ensures strict whitelisting of safe formatting tags (i, b, u, br) with zero attributes.
 * Completely neutralizes XSS vectors (script tags, event handlers, javascript: URLs, style injections).
 */
function sanitizeSubtitleDom(rawText: string): string {
  if (!rawText) return '';

  try {
    const parser = new DOMParser();
    const normalized = rawText.replace(/\r\n|\r|\n/g, '<br/>');
    const doc = parser.parseFromString(`<body>${normalized}</body>`, 'text/html');

    const allowedTags = new Set(['I', 'B', 'U', 'BR']);

    function sanitizeNode(node: Node): Node | null {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(true);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toUpperCase();

        if (allowedTags.has(tagName)) {
          const cleanEl = document.createElement(tagName);
          for (const child of Array.from(el.childNodes)) {
            const cleanChild = sanitizeNode(child);
            if (cleanChild) cleanEl.appendChild(cleanChild);
          }
          return cleanEl;
        }

        const fragment = document.createDocumentFragment();
        for (const child of Array.from(el.childNodes)) {
          const cleanChild = sanitizeNode(child);
          if (cleanChild) fragment.appendChild(cleanChild);
        }
        return fragment;
      }

      return null;
    }

    const cleanBody = document.createElement('div');
    for (const child of Array.from(doc.body.childNodes)) {
      const cleanChild = sanitizeNode(child);
      if (cleanChild) cleanBody.appendChild(cleanChild);
    }

    return cleanBody.innerHTML;
  } catch {
    const div = document.createElement('div');
    div.textContent = rawText;
    return div.innerHTML;
  }
}

export function SubtitleOverlay({
  cues,
  currentTime,
  visible,
  liveAutoCaptionText = '',
  fontSize = 'md'
}: SubtitleOverlayProps) {
  if (!visible) return null;

  const cueText = cues.length > 0 ? getActiveCueText(cues, currentTime) : '';
  const displayText = liveAutoCaptionText || cueText;

  if (!displayText) return null;

  const isLive = !!liveAutoCaptionText;

  return (
    <div className={`vp-subtitle-container font-${fontSize} ${isLive ? 'live-captions' : ''}`}>
      {isLive && (
        <span className="vp-live-caption-badge">
          <span className="live-caption-dot" /> ⚡ Auto-Caption
        </span>
      )}
      <p
        className="vp-subtitle-text"
        dangerouslySetInnerHTML={{ __html: sanitizeSubtitleDom(displayText) }}
      />
    </div>
  );
}
