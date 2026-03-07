import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';
import API_URL from './config';

const NAV = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard'  },
  { path: '/admin/orders', icon: '📦', label: 'Orders'     },
  { path: '/manage-books', icon: '📚', label: 'Inventory'  },
  { path: '/add-book',     icon: '➕', label: 'Add Book'   },
  { path: '/users',        icon: '👥', label: 'Users'      },
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
          items.push({ id: 'pending', icon: '📦', iconBg: '#eff6ff', msg: `${data.pendingOrders} order${data.pendingOrders > 1 ? 's are' : ' is'} awaiting processing.`, time: 'Just now' });
        }
        if (data.lowStockBooks > 0) {
          items.push({ id: 'lowstock', icon: '⚠️', iconBg: '#fffbeb', msg: `${data.lowStockBooks} book${data.lowStockBooks > 1 ? 's are' : ' is'} running very low on stock.`, time: 'Inventory alert' });
        }
        if (data.outOfStock > 0) {
          items.push({ id: 'outofstock', icon: '🚫', iconBg: '#fff1f2', msg: `${data.outOfStock} book${data.outOfStock > 1 ? 's are' : ' is'} completely out of stock.`, time: 'Urgent' });
        }
        if (data.totalOrders > 0) {
          items.push({ id: 'orders', icon: '✅', iconBg: '#ecfdf5', msg: `${data.totalOrders} total orders placed across all time.`, time: 'Store Activity' });
        }
        setNotifications(items);
      })
      .catch(() => {});
  }, []);

  // Close on outside click
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

  const adminInitial = (adminUser.name || 'A')[0].toUpperCase();
  const unreadCount  = notifications.length;

  return (
    <div className="ap-shell">
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

            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="ap-notif-btn"
                onClick={() => setNotifOpen(o => !o)}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="ap-notif-dot" />}
              </button>

              {notifOpen && (
                <div className="ap-notif-dropdown">
                  <div className="ap-notif-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && <span>{unreadCount} new</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="ap-notif-empty">🎉 All caught up! No alerts.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="ap-notif-item unread">
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

            {/* Refresh button */}
            {onRefresh && (
              <button
                className={`ap-refresh-btn ${refreshing ? 'spinning' : ''}`}
                onClick={onRefresh}
                title="Refresh"
              >
                🔄
              </button>
            )}

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
