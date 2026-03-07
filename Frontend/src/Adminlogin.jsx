import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';

// Premium SVG Icons
const Icons = {
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Shield: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )
};

export default function Adminlogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
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
          setError('Restricted access. This area is for authorized administrators only.');
        }
      } else {
        setError(data.error || 'Invalid credentials. Please verify and try again.');
      }
    } catch {
      setError('Connection interrupted. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Visual Side */}
      <div style={{ flex: 1, background: '#0f172a', padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>BOOKSHELF CONTROL</span>
          </div>

          <Icons.Shield />
          <h1 style={{ fontSize: 44, fontWeight: 800, margin: '24px 0 16px', lineHeight: 1.1 }}>One platform,<br /><span style={{ color: '#6366f1' }}>Total command.</span></h1>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 460, lineHeight: 1.6 }}>Manage your global inventory, track high-volume sales, and optimize business growth from a single, high-performance interface.</p>
          
          <div style={{ marginTop: 60, display: 'grid', gap: 24 }}>
            {[
              { label: 'Cloud Infrastructure', sub: 'Real-time database sync' },
              { label: 'Enterprise Security', sub: 'End-to-end encrypted sessions' },
              { label: 'AI Analytics', sub: 'Predictive inventory modeling' }
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div style={{ width: '45%', minWidth: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Internal Access</h2>
            <p style={{ color: '#64748b' }}>Sign in with your administrator credentials</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Mail /></div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  style={{ width: '100%', height: 52, padding: '0 16px 0 48px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Secure Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Lock /></div>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', height: 52, padding: '0 48px 0 48px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', height: 52, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: 40, textAlign: 'center', borderTop: '1.5px solid #f1f5f9', paddingTop: 24 }}>
            <p style={{ color: '#64748b', fontSize: 13 }}>Standard user? <span style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login')}>Return to Store</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
