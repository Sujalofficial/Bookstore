import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';
import './Adminlogin.css';

function Adminlogin() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.user.isAdmin) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('adminUser', JSON.stringify(data.user));
          navigate('/dashboard');
        } else {
          setError('Access Denied — you do not have admin privileges.');
        }
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Server unreachable. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      {/* ════ LEFT VISUAL PANEL ════ */}
      <aside className="admin-left-panel">
        {/* Background fx */}
        <div className="al-orb al-orb-1" />
        <div className="al-orb al-orb-2" />
        <div className="al-dot-grid" />

        <div className="al-left-content">

          {/* Back to home */}
          <button className="al-back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>

          <span className="al-shield-icon">🛡️</span>

          <h2 className="al-panel-title">
            Admin<br />
            <span className="al-gradient-text">Control Panel</span>
          </h2>
          <p className="al-panel-subtitle">
            Securely manage your bookstore — inventory, orders,
            users & analytics — all in one powerful dashboard.
          </p>

          {/* Feature stats */}
          <div className="al-stats">
            <div className="al-stat-item">
              <div className="al-stat-icon icon-purple">📚</div>
              <div>
                <div className="al-stat-label">Inventory Control</div>
                <div className="al-stat-value">Full Stock Management</div>
              </div>
            </div>
            <div className="al-stat-item">
              <div className="al-stat-icon icon-green">📦</div>
              <div>
                <div className="al-stat-label">Order Tracking</div>
                <div className="al-stat-value">Real-Time Status Updates</div>
              </div>
            </div>
            <div className="al-stat-item">
              <div className="al-stat-icon icon-amber">👥</div>
              <div>
                <div className="al-stat-label">User Management</div>
                <div className="al-stat-value">Monitor All Customers</div>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* ════ RIGHT FORM PANEL ════ */}
      <main className="admin-right-panel">
        <div className="admin-form-box">

          {/* Header */}
          <div className="adm-form-header">
            <div className="adm-logo-chip">
              <span className="adm-logo-dot" />
              <span className="adm-logo-text">BOOKSHELF</span>
            </div>
            <h1 className="adm-title">Welcome back, Boss 👋</h1>
            <p className="adm-subtitle">Sign in to access your admin dashboard</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="adm-error">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin}>

            {/* Email */}
            <div className="adm-input-group">
              <label className="adm-label">Admin Email</label>
              <div className="adm-input-wrap">
                <span className="adm-input-icon">✉️</span>
                <input
                  id="admin-email"
                  type="email"
                  className="adm-input"
                  placeholder="admin@bookshelf.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="adm-input-group">
              <label className="adm-label">Password</label>
              <div className="adm-input-wrap">
                <span className="adm-input-icon">🔑</span>
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  className="adm-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="adm-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              className="adm-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="adm-btn-spin" />
                  Authenticating…
                </>
              ) : (
                <>🔐 Login as Admin</>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="adm-form-footer">
            <div className="adm-divider">or</div>
            <p className="adm-user-link">
              Not an admin?{" "}
              <span onClick={() => navigate('/login')}>Sign in as Customer</span>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Adminlogin;