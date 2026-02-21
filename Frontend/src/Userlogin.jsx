import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './App.css';
import API_URL from './config';

function Userlogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Error dikhane ke liye
  const [loading, setLoading] = useState(false); // Button loading state
  
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
        // Success
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Alert hata kar seedha navigate karein (UX better hota hai)
        navigate('/userhome');
      } else {
        // Fail
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE: Image Section */}
      <div className="login-visual">
        <div className="visual-content">
          <h2>Welcome Back!</h2>
          <p>Access your digital library and continue your reading journey.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form Section */}
      <div className="login-form-container">
        <div className="form-wrapper">
          <h2 className="form-title">Login</h2>
          <p className="form-subtitle">Please enter your details</p>

          {/* Error Message */}
          {error && <div className="error-message">⚠️ {error}</div>}

          <form onSubmit={handleLogin}>
            
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* REGISTER LINK */}
          <div className="form-footer">
            <p>Don't have an account? 
              <NavLink to="/register" className="link-text"> Sign up for free</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Userlogin;