import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './Userlogin.css'; // Updated CSS specifically for User Login
import API_URL from './config';

function Userlogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/userhome');
      } else {
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ul-page">
      {/* Background Blobs for Glassmorphism Effect */}
      <div className="ul-bg-blob-1"></div>
      <div className="ul-bg-blob-2"></div>

      {/* Back to Home Button */}
      <NavLink to="/" className="ul-back-btn">
        <span>←</span> Back to Home
      </NavLink>

      <div className="ul-container">
        {/* LEFT SIDE: Visuals */}
        <div className="ul-visual">
          <div className="ul-visual-content">
            <h1 className="ul-visual-title">Welcome<br/>Back.</h1>
            <p className="ul-visual-subtitle">
              Access your digital library, explore personalized UI, and dive into your next great story.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="ul-form-section">
          <h2 className="ul-form-title">Sign in</h2>
          <p className="ul-form-subtitle">Please enter your credentials to proceed.</p>

          {error && <div className="ul-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="ul-input-group">
              <label>Email Address</label>
              <input 
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="ul-input-group">
              <label>Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="ul-btn" disabled={loading}>
              {loading ? "Signing in..." : "Continue to Account"}
            </button>
          </form>

          <div className="ul-footer">
            Don't have an account?{' '}
            <NavLink to="/register" className="ul-link">Sign up for free</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Userlogin;