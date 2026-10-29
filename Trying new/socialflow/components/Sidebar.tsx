'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/upload', label: 'Upload Video', icon: '📤' },
    { href: '/scheduled', label: 'Scheduled Posts', icon: '📅' },
    { href: '/history', label: 'Post History', icon: '📜' },
    { href: '/accounts', label: 'Connected Accounts', icon: '🔗' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header" aria-label="Mobile Navigation Bar">
        <div className="mobile-brand">
          <div className="logo-icon-sm">SF</div>
          <span className="mobile-title">SocialFlow</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/upload" className="btn btn-primary btn-sm" aria-label="Upload Video">
            📤 Upload
          </Link>
          <button 
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop + Mobile Drawer) */}
      <aside 
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        aria-label="Primary Navigation"
      >
        <div className="sidebar-logo">
          <div className="logo-icon" aria-hidden="true">SF</div>
          <h1>SocialFlow</h1>
        </div>
        <nav className="sidebar-nav" aria-label="App Navigation">
          <div className="nav-section-title">Main</div>
          {navItems.slice(0, 4).map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={closeMobile}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="nav-section-title" style={{ marginTop: '16px' }}>Settings</div>
          {navItems.slice(4).map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={closeMobile}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div className="card" style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.06)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>🚀 Quick Upload</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Upload a video to both platforms instantly</div>
            <Link 
              href="/upload" 
              onClick={closeMobile}
              className="btn btn-primary btn-sm w-full" 
              style={{ justifyContent: 'center' }}
            >
              Upload Now
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Quick Dock */}
      <nav className="mobile-bottom-dock" aria-label="Mobile Quick Bar">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`dock-item ${pathname === item.href ? 'active' : ''}`}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span className="dock-icon">{item.icon}</span>
            <span className="dock-label">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
