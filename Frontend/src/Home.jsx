import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* ── Animated Background ── */}
      <div className="home-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="dot-grid" />
      </div>

      <div className="home-inner">

        {/* ════ LEFT BRAND PANEL ════ */}
        <div className="home-left">

          {/* Live badge */}
          <div className="home-badge">
            <span className="badge-dot" />
            Now Live — AI-Powered Bookstore
          </div>

          {/* Brand name */}
          <h1 className="home-brand">
            Your world<br />
            of <span className="brand-highlight">stories</span>,<br />
            delivered.
          </h1>

          <p className="home-tagline">
            Discover thousands of books across every genre.
            Powered by AI recommendations, real-time inventory,
            and a seamless reading experience.
          </p>

          {/* Feature pills */}
          <div className="home-features">
            <div className="feat-pill">
              <span className="pill-icon">🤖</span> AI Summaries
            </div>
            <div className="feat-pill">
              <span className="pill-icon">📦</span> Live Inventory
            </div>
            <div className="feat-pill">
              <span className="pill-icon">🔐</span> Secure Checkout
            </div>
            <div className="feat-pill">
              <span className="pill-icon">🗺️</span> Reading Roadmap
            </div>
          </div>

          {/* Decorative book spines */}
          <div className="home-books-deco">
            <div className="deco-book" />
            <div className="deco-book" />
            <div className="deco-book" />
            <div className="deco-book" />
            <div className="deco-book" />
          </div>
        </div>

        {/* ════ RIGHT CARDS PANEL ════ */}
        <div className="home-right">
          <p className="home-right-title">Get Started</p>

          {/* User Card */}
          <div
            className="choice-card user-card"
            onClick={() => navigate("/login")}
          >
            <div className="card-icon-wrap">👤</div>
            <div className="card-title">Customer Login</div>
            <div className="card-subtitle">
              Browse thousands of books, manage your cart, track orders, and get
              AI-powered recommendations.
            </div>
            <button className="card-arrow-btn">
              Login as User <span className="arrow-icon">→</span>
            </button>
          </div>

          {/* Admin Card */}
          <div
            className="choice-card admin-card"
            onClick={() => navigate("/adminlogin")}
          >
            <div className="card-icon-wrap">🔐</div>
            <div className="card-title">Admin Portal</div>
            <div className="card-subtitle">
              Manage inventory, track orders, monitor users, and control the
              entire bookstore from one dashboard.
            </div>
            <button className="card-arrow-btn">
              Admin Access <span className="arrow-icon">→</span>
            </button>
          </div>

          <div className="home-divider">or</div>

          {/* Register link */}
          <p className="home-register-link">
            New here?{" "}
            <span onClick={() => navigate("/register")}>
              Create a free account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;