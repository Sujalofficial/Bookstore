import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './App.css';
import API_URL from './config';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Registration Successful!");
        navigate('/login');
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE: Visual Section */}
      <div className="login-visual register-visual">
        <div className="visual-content">
          <h2>Join Our Community!</h2>
          <p>Create an account to access your personal digital library and start your reading journey today.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form Section */}
      <div className="login-form-container">
        <div className="form-wrapper">
          <h2 className="form-title">Create Account</h2>
          <p className="form-subtitle">Please fill in your details</p>

          {/* Error Message */}
          {error && <div className="error-message">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>

            <button type="submit" className="login-btn register-btn" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* LOGIN LINK */}
          <div className="form-footer">
            <p>Already have an account? 
              <NavLink to="/login" className="link-text"> Sign in</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
