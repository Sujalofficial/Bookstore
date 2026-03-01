import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css';
import API_URL from './config';

function Roadmap() {
  const [goal, setGoal] = useState("");
  const [roadmap, setRoadmap] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRoadmap("");
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/ai-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRoadmap(data.roadmap);
      } else {
        setError(data.error || "AI could not generate a roadmap. Please try again.");
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection.");
      console.error("Roadmap Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="main-wrapper">
      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/userhome")} style={{cursor: 'pointer'}}>
          BOOKSHELF.
        </div>
        <div className="nav-links">
          <Link to="/userhome" className="nav-item">Home</Link>
          <Link to="/profile" className="nav-item">👤 Profile</Link>
          <Link to="/cart" className="nav-item">🛒 Cart</Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="content-container roadmap-section">
        <header className="hero-section">
          <h1>🗺️ AI Learning Roadmap</h1>
          <p>Don't just read books, follow a path to mastery.</p>
        </header>

        {/* Input Form */}
        <div className="roadmap-input-card">
          <form onSubmit={handleGenerate}>
            <input 
              type="text" 
              placeholder="e.g., I want to become a Python Expert / Learn Stock Market" 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="ai-btn">
              {loading ? "Analyzing Skills... 🧠" : "Generate Roadmap ✨"}
            </button>
          </form>
          {error && (
            <div style={{
              marginTop: '14px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Roadmap Display */}
        {roadmap && (
          <div className="roadmap-result-container animate-fade">
            <h2 className="result-title">Your Personalized Path 🚀</h2>
            <div className="roadmap-content">
              {roadmap.split('\n').map((line, index) => {
                // Color logic for availability
                let colorClass = "";
                if (line.includes("[AVAILABLE IN OUR STORE]")) colorClass = "in-stock-tag";
                if (line.includes("[EXTERNAL RECOMMENDATION]")) colorClass = "external-tag";

                return (
                  <p key={index} className={`roadmap-line ${colorClass}`}>
                    {line}
                  </p>
                );
              })}
            </div>
            <button className="add-to-cart-btn" style={{marginTop: '20px'}} onClick={() => navigate("/userhome")}>
              Go Shop Recommended Books 🛒
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Roadmap;