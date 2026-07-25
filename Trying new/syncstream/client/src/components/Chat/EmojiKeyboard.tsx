import { useState } from 'react';
import './EmojiKeyboard.css';

interface EmojiKeyboardProps {
  onSelectEmoji: (emoji: string) => void;
  onSendReaction?: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: '😃 Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓']
  },
  {
    id: 'cinema',
    name: '🍿 Cinema',
    emojis: ['🍿', '🎬', '📽️', '🎞️', '🎟️', '🎭', '📺', '📼', '📹', '🎥', '🎧', '🎤', '🎪', '🎨', '🌟', '✨', '⚡', '🔥', '💥', '💯', '👏', '🙌', '🎉', '🎊', '🏆', '🥇', '👑', '💎', '🚀']
  },
  {
    id: 'hands',
    name: '👋 Reactions',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '🤙', '🖐️', '✋', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '💪', '🖕']
  },
  {
    id: 'animals',
    name: '🐱 Animals',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞']
  },
  {
    id: 'food',
    name: '🍕 Food',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🌽', '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥯', '🥖', '🧀', '🥗', '🍲', '🍜', '🍝', '🍣', '🍱', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🧃', '🥤', '☕', '🍵', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾']
  }
];

export function EmojiKeyboard({ onSelectEmoji, onSendReaction, onClose }: EmojiKeyboardProps) {
  const [activeCategory, setActiveCategory] = useState('cinema');
  const [search, setSearch] = useState('');

  const currentCategory = EMOJI_CATEGORIES.find(cat => cat.id === activeCategory) || EMOJI_CATEGORIES[0];

  // Search across all categories
  const allEmojis = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
  const displayedEmojis = search.trim()
    ? Array.from(new Set(allEmojis))
    : currentCategory.emojis;

  return (
    <div className="emoji-keyboard glass animate-scale-spring">
      <div className="emoji-keyboard-header">
        <input
          className="input emoji-search-input"
          type="text"
          placeholder="Search emojis…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {onClose && (
          <button className="btn-icon emoji-close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {!search.trim() && (
        <div className="emoji-category-tabs">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`emoji-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="emoji-grid">
        {displayedEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            className="emoji-item"
            onClick={() => {
              onSelectEmoji(emoji);
              if (onSendReaction) onSendReaction(emoji);
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
