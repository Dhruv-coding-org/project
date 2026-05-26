'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/upload', label: 'Upload Video', icon: '📤' },
    { href: '/scheduled', label: 'Scheduled Posts', icon: '📅' },
    { href: '/history', label: 'Post History', icon: '📜' },
    { href: '/accounts', label: 'Connected Accounts', icon: '🔗' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">SF</div>
        <h1>SocialFlow</h1>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        {navItems.slice(0, 4).map((item) => (
          <Link key={item.href} href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="nav-section-title" style={{ marginTop: '16px' }}>Settings</div>
        {navItems.slice(4).map((item) => (
          <Link key={item.href} href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div className="card" style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>🚀 Quick Upload</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Upload a video to both platforms instantly</div>
          <Link href="/upload" className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }}>Upload Now</Link>
        </div>
      </div>
    </aside>
  );
}
