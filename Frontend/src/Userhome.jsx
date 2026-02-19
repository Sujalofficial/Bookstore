import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

export default function Userhome() {
    const [books, setBooks] = useState([]); 
    const [filteredBooks, setFilteredBooks] = useState([]); 
    const [category, setCategory] = useState("All");
    
    // --- AI STATES ---
    const [aiSummary, setAiSummary] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    const navigate = useNavigate();
    const API_URL = "http://localhost:5000";
    const user = JSON.parse(localStorage.getItem('user')) || { name: "Reader" };

    useEffect(() => {
        fetch(`${API_URL}/api/books`)
            .then(res => res.json())
            .then(data => {
                setBooks(data);
                setFilteredBooks(data);
            })
            .catch(err => console.log(err));
    }, []);

    const fetchAISummary = async (book) => {
        setIsAiLoading(true);
        setShowAiModal(true);
        setAiSummary("Generating smart AI insights...");
        try {
            const res = await fetch(`${API_URL}/api/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: book.title, 
                    author: book.author, 
                    category: book.category 
                })
            });
            const data = await res.json();
            setAiSummary(data.summary);
        } catch (err) {
            setAiSummary("Sorry, AI is currently busy. Please try again later.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleCategoryChange = (e) => {
        const selected = e.target.value;
        setCategory(selected);
        if (selected === "All") {
            setFilteredBooks(books);
        } else {
            const filtered = books.filter(book => book.category === selected);
            setFilteredBooks(filtered);
        }
    };

    const addToCart = async (book) => {
        const token = localStorage.getItem('token');
        if (!token) return navigate("/login");
        try {
            const res = await fetch(`${API_URL}/api/cart/add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    bookId: book._id, title: book.title, price: book.price, image: book.image
                })
            });
            const data = await res.json();
            navigate("/cart"); // Pehle jo update kiya tha
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="main-wrapper">
            <nav className="navbar">
                <div className="nav-logo" onClick={() => navigate("/userhome")} style={{cursor:'pointer'}}>BOOKSHELF.</div>
                
                <div className="search-container">
                    <select className="category-select" value={category} onChange={handleCategoryChange}>
                        <option value="All">All Categories</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Self-Help">Self-Help</option>
                        <option value="Business">Business</option>
                        <option value="Technology">Technology</option>
                        <option value="Thriller">Thriller</option>
                    </select>
                </div>

                <div className="nav-links">
                    {/* ✅ NAV LINK 1: AI Roadmap Added professionally */}
                    <span className="nav-item roadmap-link" onClick={() => navigate("/roadmap")}>🗺️ AI Roadmap</span>
                    
                    <span className="nav-item" onClick={() => navigate("/cart")}>🛒 Cart</span>
                    <span className="nav-item" onClick={() => navigate("/profile")}>👤 {user.name}</span>
                    <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-container">
                <header className="welcome-section">
                    <h1>{category === "All" ? "Explore All Books" : `${category} Collection`}</h1>
                    <p style={{color: '#666'}}>AI-Powered recommendations just for you.</p>
                </header>

                {/* ✅ NAV LINK 2: Professional Feature Banner */}
                <div className="roadmap-banner" onClick={() => navigate("/roadmap")}>
                    <div className="banner-content">
                        <h3>🚀 Stuck on what to learn next?</h3>
                        <p style={{color: 'rgb(250, 243, 243)'}}>Generate a personalized AI Reading Roadmap based on your career goals.</p>
                    </div>
                    <button className="banner-btn">Get Started ✨</button>
                </div>


<div className="book-grid">
    {filteredBooks.map((book) => (
        <div key={book._id} className="book-card">
            {/* Image Wrapper for better styling */}
            <div className="book-image-container">
                <img 
                    src={`${API_URL}${book.image}`} 
                    alt={book.title} 
                    className="book-image" 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/200x300?text=Book+Cover"; }}
                />
                <span className="floating-badge">{book.category}</span>
            </div>
            
            <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                
                <div className="price-section">
                    <span className="price-tag">₹{book.price}</span>
                </div>
                
                <div className="button-group">
                    <button className="ai-btn-small" onClick={() => fetchAISummary(book)}>
                        ✨ Insight
                    </button>
                    <button className="add-btn-main" onClick={() => addToCart(book)}>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    ))}
</div>


            </main>

            {/* AI Modal code stays exactly as it was... */}
            {showAiModal && (
                <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
                    <div className="ai-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🤖 AI Smart Summary</h3>
                            <button className="close-x" onClick={() => setShowAiModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {isAiLoading ? (
                                <div className="loader-box">
                                    <div className="spinner"></div>
                                    <p>Gemini is thinking...</p>
                                </div>
                            ) : (
                                <p className="summary-text">{aiSummary}</p>
                            )}
                        </div>
                        {!isAiLoading && (
                            <button className="modal-close-btn" onClick={() => setShowAiModal(false)}>Close</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}