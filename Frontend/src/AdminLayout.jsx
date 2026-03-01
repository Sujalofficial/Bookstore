import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './Admin.css';

const NAV = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard'  },
  { path: '/admin/orders', icon: '📦', label: 'Orders'     },
  { path: '/manage-books', icon: '📚', label: 'Inventory'  },
  { path: '/add-book',     icon: '➕', label: 'Add Book'   },
  { path: '/users',        icon: '👥', label: 'Users'      },
];

export default function AdminLayout({ children, title, subtitle, onRefresh, refreshing }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ap-theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('ap-dark');
      localStorage.setItem('ap-theme', 'dark');
    } else {
      document.body.classList.remove('ap-dark');
      localStorage.setItem('ap-theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    if (window.confirm('Logout from Admin Panel?')) {
      localStorage.clear();
      navigate('/adminlogin');
    }
  };

  return (
    <div className={`ap-shell ${darkMode ? 'dark-mode' : ''}`}>
      <Toaster position="top-right" toastOptions={{ className: 'ap-toast-new' }} />
      {/* ─── SIDEBAR ─── */}
      <aside className="ap-sidebar">
        <div className="ap-sidebar-logo">BOOK<span>SHELF.</span></div>
        <div className="ap-sidebar-label">Navigation</div>
        {NAV.map(n => (
          <button
            key={n.path}
            className={`ap-nav-item ${location.pathname === n.path ? 'active' : ''}`}
            onClick={() => navigate(n.path)}
          >
            <span className="ap-nav-icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div className="ap-sidebar-footer">
          <button className="ap-logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div className="ap-main">
        {/* Top bar */}
        <div className="ap-topbar">
          <div>
            <div className="ap-page-title">{title}</div>
            {subtitle && <div className="ap-page-subtitle">{subtitle}</div>}
          </div>
          <div className="ap-topbar-right">
            <button className="ap-refresh-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle Theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <span className="ap-admin-chip">👑 {adminUser.name || 'Admin'}</span>
            {onRefresh && (
              <button className={`ap-refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={onRefresh} title="Refresh">
                🔄
              </button>
            )}
          </div>
        </div>
        {/* Page content */}
        <div className="ap-body">{children}</div>
      </div>
    </div>
  );
}
