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
    <div className="auth-page">
      
      {/* LEFT SIDE */}
      <div className="auth-visual register-visual">
        <div className="visual-overlay"></div>
        <div className="visual-content">
          <h2>Start Your Reading Journey 📚</h2>
          <p>
            Join thousands of readers managing their personal digital library.
            Discover, organize and track your favorite books in one place.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-form-container">
        <div className="form-wrapper glass-card">

          <h2 className="form-title">Create Account</h2>
          <p className="form-subtitle">Let’s get you started</p>

          {error && <div className="error-message">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            
            <div className="input-group">
              <input 
                type="text" 
                placeholder=" " 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <label>Full Name</label>
            </div>

            <div className="input-group">
              <input 
                type="email" 
                placeholder=" " 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
              <label>Email Address</label>
            </div>

            <div className="input-group">
              <input 
                type="password" 
                placeholder=" " 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
              <label>Password</label>
            </div>

            <button type="submit" className="auth-btn register-btn" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already have an account?
              <NavLink to="/login" className="link-text"> Sign in</NavLink>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;