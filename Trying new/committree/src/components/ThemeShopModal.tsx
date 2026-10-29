import React from 'react';
import { type UserProfile, updateProfileTheme } from '../store/profileStore';
import { soundEngine } from '../utils/soundEngine';

interface ThemeShopModalProps {
  activeProfile: UserProfile;
  onThemeChange: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

interface ThemeOption {
  id: 'default' | 'cyberpunk' | 'github' | 'retro' | 'pastel';
  name: string;
  icon: string;
  description: string;
  bgPreview: string;
  nodePreviewColor: string;
  linePreviewColor: string;
  badgePreview: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'default',
    name: 'Default Dark',
    icon: '🌙',
    description: 'The standard CommitTree aesthetic: sleek dark slate with vivid indigo and emerald accents.',
    bgPreview: '#0F172A',
    nodePreviewColor: '#3B82F6',
    linePreviewColor: '#64748B',
    badgePreview: '#10B981',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: '⚡',
    description: 'High-octane neon cyan and electric magenta with intense glowing drop-shadows and dark void backgrounds.',
    bgPreview: '#050510',
    nodePreviewColor: '#00F0FF',
    linePreviewColor: '#FF007F',
    badgePreview: '#FFD700',
  },
  {
    id: 'github',
    name: 'GitHub Classic',
    icon: '🐙',
    description: 'Inspired by GitHub dark mode: emerald commit dots, signature blue branch pointers, and slate lines.',
    bgPreview: '#0D1117',
    nodePreviewColor: '#2EA043',
    linePreviewColor: '#58A6FF',
    badgePreview: '#8B949E',
  },
  {
    id: 'retro',
    name: 'Retro CRT 1980s',
    icon: '📺',
    description: 'Old-school amber phosphor monochrome monitor glow with simulated scanline overlays and matrix contrast.',
    bgPreview: '#081008',
    nodePreviewColor: '#FFB000',
    linePreviewColor: '#00FF66',
    badgePreview: '#FFB000',
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    icon: '🌸',
    description: 'Soft lavender, mint green, and peach pastel bubbles for a calming, relaxed coding atmosphere.',
    bgPreview: '#1E1B4B',
    nodePreviewColor: '#C084FC',
    linePreviewColor: '#6EE7B7',
    badgePreview: '#FDE047',
  },
];

export const ThemeShopModal: React.FC<ThemeShopModalProps> = ({
  activeProfile,
  onThemeChange,
  onClose,
}) => {
  const currentTheme = activeProfile.theme || 'default';

  const handleSelectTheme = (themeId: 'default' | 'cyberpunk' | 'github' | 'retro' | 'pastel') => {
    soundEngine.playSuccess();
    const updated = updateProfileTheme(themeId);
    onThemeChange(updated);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-shop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🎨</span>
            <h3>Graph Theme & Skin Shop</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <p className="theme-shop-intro">
          Personalize your Git visualization! Equipped themes transform your commit nodes, connecting lines, and graph atmosphere. Each player profile remembers its own selected theme.
        </p>

        <div className="themes-grid">
          {THEMES.map((theme) => {
            const isEquipped = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                className={`theme-card ${isEquipped ? 'equipped' : ''}`}
                style={{ backgroundColor: theme.bgPreview }}
                onClick={() => handleSelectTheme(theme.id)}
              >
                <div className="theme-card-header">
                  <span className="theme-icon">{theme.icon}</span>
                  <h4 className="theme-name">{theme.name}</h4>
                  {isEquipped && <span className="equipped-badge">✓ EQUIPPED</span>}
                </div>

                <p className="theme-desc">{theme.description}</p>

                {/* Mini Graph Preview Box */}
                <div className="theme-preview-box">
                  <div className="preview-node" style={{ backgroundColor: theme.nodePreviewColor, boxShadow: `0 0 10px ${theme.nodePreviewColor}` }}></div>
                  <div className="preview-line" style={{ backgroundColor: theme.linePreviewColor }}></div>
                  <div className="preview-node" style={{ backgroundColor: theme.badgePreview, boxShadow: `0 0 10px ${theme.badgePreview}` }}></div>
                  <span className="preview-label" style={{ color: theme.nodePreviewColor }}>main</span>
                </div>

                <button
                  className={`theme-equip-btn ${isEquipped ? 'active-btn' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTheme(theme.id);
                  }}
                >
                  {isEquipped ? 'Active Theme' : 'Equip Skin'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
