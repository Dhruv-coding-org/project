import type { EmojiReaction } from '../../types';
import './EmojiReactions.css';

interface EmojiReactionsProps {
  reactions: EmojiReaction[];
}

export function EmojiReactions({ reactions }: EmojiReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="emoji-reactions-overlay" pointer-events="none">
      {reactions.map((r, i) => {
        // Random horizontal drift offset (-30px to +30px) based on index/id hash
        const drift = ((i * 17) % 60) - 30;
        const leftPercent = 15 + ((i * 23) % 70);

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
