import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';
import API_URL from './config';

// Premium SVG Icons
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
  ),
  Orders: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Add: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  Refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
  ),
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  )
};

const NAV = [
  { path: '/dashboard',    icon: <Icons.Dashboard />, label: 'Dashboard'  },
  { path: '/admin/orders', icon: <Icons.Orders />,    label: 'Orders'     },
  { path: '/manage-books', icon: <Icons.Inventory />, label: 'Inventory'  },
  { path: '/add-book',     icon: <Icons.Add />,       label: 'Add Book'   },
  { path: '/users',        icon: <Icons.Users />,     label: 'Users'      },
];

export default function AdminLayout({ children, title, subtitle, onRefresh, refreshing }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const adminUser  = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Build notifications from stats
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const items = [];
        if (data.pendingOrders > 0) {
          items.push({ id: 'pending', icon: '📦', iconBg: '#fff8e1', msg: `${data.pendingOrders} order${data.pendingOrders > 1 ? 's' : ''} awaiting processing.`, time: 'Just now' });
        }
        if (data.lowStockBooks > 0) {
          items.push({ id: 'lowstock', icon: '⚠️', iconBg: '#ffeeee', msg: `${data.lowStockBooks} book${data.lowStockBooks > 1 ? 's' : ''} low on stock.`, time: 'Inventory alert' });
        }
        if (data.totalOrders > 0) {
          items.push({ id: 'orders', icon: '✅', iconBg: '#e8f5e9', msg: `Total store activity looks healthy.`, time: 'Store Activity' });
        }
        setNotifications(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Logout from Admin Panel?')) {
      localStorage.clear();
      navigate('/adminlogin');
    }
  };

  const isDashboard = location.pathname === '/dashboard';
  const adminInitial = (adminUser.name || 'A')[0].toUpperCase();
  const unreadCount  = notifications.length;

  return (
    <div className="ap-shell animate-fade-in">
      {/* ─── SIDEBAR ─── */}
      <aside className="ap-sidebar">
        <div className="ap-sidebar-logo">
          BOOK<span>SHELF.</span>
        </div>
        
        <div className="ap-sidebar-label">Main Menu</div>
        <div className="ap-nav-group">
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
        </div>

        <div className="ap-sidebar-footer">
          <button className="ap-logout-btn" onClick={handleLogout}>
            <Icons.Logout /> Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div className="ap-main">
        {/* Top bar */}
        <div className="ap-topbar">
          <div className="ap-topbar-left">
            {!isDashboard && (
              <button className="ap-back-btn" onClick={() => navigate('/dashboard')}>
                <Icons.Back /> Back to Dashboard
              </button>
            )}
            <div style={{ marginLeft: !isDashboard ? 12 : 0 }}>
              <div className="ap-page-title">{title}</div>
              {subtitle && <div className="ap-page-subtitle">{subtitle}</div>}
            </div>
          </div>

          <div className="ap-topbar-right">
            {/* Refresh button */}
            {onRefresh && (
              <button
                className={`ap-icon-btn ${refreshing ? 'spinning' : ''}`}
                onClick={onRefresh}
                title="Refresh"
              >
                <Icons.Refresh />
              </button>
            )}

            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="ap-notif-btn"
                onClick={() => setNotifOpen(o => !o)}
                title="Notifications"
              >
                <Icons.Bell />
                {unreadCount > 0 && <span className="ap-notif-dot" />}
              </button>

              {notifOpen && (
                <div className="ap-notif-dropdown">
                  <div className="ap-notif-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && <span className="ap-badge primary">{unreadCount}</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>
                      🎉 All caught up!
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="ap-notif-item">
                        <div className="ap-notif-icon" style={{ background: n.iconBg }}>
                          {n.icon}
                        </div>
                        <div className="ap-notif-body">
                          <p>{n.msg}</p>
                          <time>{n.time}</time>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User avatar chip */}
            <div className="ap-admin-chip">
              <div className="ap-avatar-sm">{adminInitial}</div>
              {adminUser.name || 'Admin'}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="ap-body">{children}</div>
      </div>
    </div>
  );
}
