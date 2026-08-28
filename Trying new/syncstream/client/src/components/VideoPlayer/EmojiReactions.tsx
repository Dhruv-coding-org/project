import type { EmojiReaction } from '../../types';
import './EmojiReactions.css';

interface EmojiReactionsProps {
  reactions: EmojiReaction[];
}

function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function EmojiReactions({ reactions }: EmojiReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="emoji-reactions-overlay">
      {reactions.map((r) => {
        const hash = getHashCode(r.id);
        // Deterministic horizontal drift offset (-30px to +30px) based on reaction ID
        const drift = (hash % 60) - 30;
        // Deterministic left percentage (15% to 85%) based on reaction ID
        const leftPercent = 15 + (hash % 70);

        return (
          <div
            key={r.id}
            className="emoji-particle"
            style={{
              left: `${leftPercent}%`,
              '--drift': `${drift}px`,
            } as React.CSSProperties}
          >
            <span className="emoji-char">{r.emoji}</span>
            <span className="emoji-sender">{r.username}</span>
          </div>
        );
      })}
    </div>
  );
}
