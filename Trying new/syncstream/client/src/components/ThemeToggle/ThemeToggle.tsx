import { useTheme } from '../../utils/theme';
import './ThemeToggle.css';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const getThemeInfo = () => {
    switch (theme) {
      case 'fire':
        return { icon: '🔥', label: 'Inferno', nextLabel: 'Modern Dark (🌙)' };
      case 'dark':
        return { icon: '🌙', label: 'Dark', nextLabel: 'Modern Light (☀️)' };
      case 'light':
        return { icon: '☀️', label: 'Light', nextLabel: 'Inferno Fire (🔥)' };
      default:
        return { icon: '🔥', label: 'Inferno', nextLabel: 'Modern Dark (🌙)' };
    }
  };

  const { icon, label, nextLabel } = getThemeInfo();

  return (
    <button
      type="button"
      className={`theme-toggle-btn theme-${theme} ${compact ? 'compact' : ''} ${className}`}
      onClick={toggleTheme}
      title={`Theme: ${label} • Click to switch to ${nextLabel}`}
      aria-label={`Theme: ${label} • Click to switch to ${nextLabel}`}
      id="theme-toggle-btn"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="theme-toggle-text">
        {label}
      </span>
    </button>
  );
}
