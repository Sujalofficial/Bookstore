import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css"; // CSS niche hai

function Home() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Hero Section with Glassmorphism Effect */}
      <div className="hero-box">
        <h1 className="brand-title">📚 The BookStore</h1>
        <p className="brand-subtitle">Your gateway to a world of stories.</p>
        
        <div className="choice-container">
          
          {/* Option 1: User Login */}
          <div className="choice-card user-card" onClick={() => navigate("/login")}>
            <div className="icon">👤</div>
            <h3>Customer Login</h3>
            <p>Browse books, manage cart & shop</p>
            <button className="action-btn">Login as User →</button>
          </div>

          {/* Option 2: Admin Login */}
          <div className="choice-card admin-card" onClick={() => navigate("/adminlogin")}>
            <div className="icon">🔐</div>
            <h3>Admin Portal</h3>
            <p>Manage inventory & users</p>
            <button className="action-btn outline">Admin Access →</button>
          </div>

        </div>

        <p className="footer-text">
          New here? <span onClick={() => navigate("/register")} className="register-link">Create an account</span>
        </p>
      </div>
    </div>
  );
}

export default Home;