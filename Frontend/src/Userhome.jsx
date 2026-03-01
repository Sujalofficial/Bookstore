import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './Userhome.css';
import API_URL from './config';

const CATEGORIES = ["All", "Fiction", "Self-Help", "Business", "Technology", "Thriller", "Science", "History", "Biography"];
const SORTS = [
  { value: "newest",    label: "Newest First" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc",label: "Price: High → Low" },
  { value: "az",        label: "A → Z" },
];

const getStockChip = (qty) => {
  if (qty <= 0) return { label: "Out of Stock", cls: "out" };
  if (qty <= 5) return { label: `⚠️ ${qty} left`,   cls: "low" };
  return               { label: `✅ In Stock`,        cls: "in"  };
};

// Skeleton placeholder
const SkeletonCard = () => (
  <div className="uh-skeleton-card">
    <div className="skel-line skel-img" />
    <div className="skel-body">
      <div className="skel-line h14 w80" />
      <div className="skel-line h12 w60" />
      <div className="skel-line h12 w40" />
    </div>
  </div>
);

export default function Userhome() {
  const [books,         setBooks]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [category,      setCategory]      = useState("All");
  const [sort,          setSort]          = useState("newest");
  const [stockOnly,     setStockOnly]     = useState(false);
  const [wishlist,      setWishlist]      = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [cartCount,     setCartCount]     = useState(0);
  const [toast,         setToast]         = useState(null);
  const [addingId,      setAddingId]      = useState(null);

  // AI Modal
  const [aiModal,       setAiModal]       = useState(null); // { book } | null
  const [aiSummary,     setAiSummary]     = useState("");
  const [aiLoading,     setAiLoading]     = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Reader" };

  // Fetch books
  useEffect(() => {
    fetch(`${API_URL}/api/books`)
      .then(r => r.json())
      .then(data => { setBooks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Fetch cart count
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/cart/items`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setCartCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  // Filtered + sorted books
  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (category !== "All") result = result.filter(b => b.category === category);
    if (search.trim())      result = result.filter(b =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    );
    if (stockOnly) result = result.filter(b => b.quantity > 0);
    switch (sort) {
      case "price-asc":  result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "az":         result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break; // newest = DB order
    }
    return result;
  }, [books, category, search, stockOnly, sort]);

  // Wishlist toggle
  const toggleWishlist = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(w => w !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    showToast(wishlist.includes(id) ? "💔 Removed from wishlist" : "❤️ Added to wishlist");
  };

  // Add to cart
  const addToCart = async (book) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    if (book.quantity <= 0) return;
    setAddingId(book._id);
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId: book._id, title: book.title, price: book.price, image: book.image }),
      });
      if (res.ok) {
        setCartCount(c => c + 1);
        showToast(`🛒 "${book.title}" added to cart!`);
      } else {
        const d = await res.json();
        showToast(d.error || "Could not add to cart", "error");
      }
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setAddingId(null);
    }
  };

  // AI Summary
  const openAiModal = async (book) => {
    setAiModal(book);
    setAiSummary("");
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: book.title, author: book.author }),
      });
      const data = await res.json();
      setAiSummary(res.ok ? data.summary : (data.error || "AI unavailable. Try again."));
    } catch {
      setAiSummary("⚠️ Could not reach the server.");
    } finally {
      setAiLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="uh-wrapper">

      {/* ═══ NAVBAR ═══ */}
      <nav className="uh-nav">
        <div className="uh-logo" onClick={() => navigate("/userhome")}>
          BOOK<span>SHELF</span>.
        </div>

        <div className="uh-search-wrap">
          <span className="uh-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="uh-nav-actions">
          <button className="uh-nav-btn" onClick={() => navigate("/roadmap")}>🗺️ <span>Roadmap</span></button>
          <button className="uh-nav-btn uh-cart-btn" onClick={() => navigate("/cart")}>
            🛒 <span>Cart</span>
            {cartCount > 0 && <span className="uh-cart-badge">{cartCount}</span>}
          </button>
          <button className="uh-nav-btn" onClick={() => navigate("/profile")}>👤 <span>{user.name}</span></button>
          <button className="uh-logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="uh-main">

        {/* AI Roadmap Banner */}
        <div className="uh-banner" onClick={() => navigate("/roadmap")}>
          <div className="uh-banner-text">
            <h3>🚀 Not sure what to read next?</h3>
            <p>Generate a personalized AI Reading Roadmap tailored to your goals — powered by Gemini 2.5.</p>
          </div>
          <button className="uh-banner-btn">Get Started ✨</button>
        </div>

        {/* Controls */}
        <div className="uh-controls">
          <div>
            <span className="uh-section-title">
              {category === "All" ? "All Books" : `${category}`}
            </span>
            {!loading && (
              <span className="uh-book-count">
                {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="uh-filters">
            {/* In-stock toggle */}
            <label className="uh-stock-toggle" onClick={() => setStockOnly(s => !s)}>
              <div className={`toggle-switch ${stockOnly ? "on" : ""}`} />
              In-stock only
            </label>

            {/* Sort */}
            <select className="uh-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="uh-pills" style={{ marginBottom: 22 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`uh-pill ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="uh-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="uh-empty">
            <div className="uh-empty-icon">📭</div>
            <h3>No books found</h3>
            <p>Try a different category, sort, or clear your search.</p>
            <button className="uh-empty-btn" onClick={() => { setCategory("All"); setSearch(""); setStockOnly(false); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="uh-grid">
            {filteredBooks.map(book => {
              const chip = getStockChip(book.quantity);
              const wished = wishlist.includes(book._id);
              const isAdding = addingId === book._id;
              return (
                <div key={book._id} className="uh-book-card">

                  {/* Wishlist heart */}
                  <button
                    className={`uh-wish-btn ${wished ? "wished" : ""}`}
                    onClick={() => toggleWishlist(book._id)}
                    title={wished ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wished ? "❤️" : "🤍"}
                  </button>

                  {/* Image + overlay */}
                  <div className="uh-img-wrap">
                    <img
                      src={`${API_URL}${book.image}`}
                      alt={book.title}
                      onError={e => { e.target.src = "https://via.placeholder.com/200x300?text=Cover"; }}
                    />
                    <span className="uh-cat-badge">{book.category}</span>

                    {/* Hover quick-actions */}
                    <div className="uh-hover-overlay">
                      <button className="uh-overlay-btn" onClick={() => openAiModal(book)}>✨ AI Insight</button>
                      <button
                        className="uh-overlay-btn primary"
                        onClick={() => addToCart(book)}
                        disabled={book.quantity <= 0 || isAdding}
                      >
                        {book.quantity <= 0 ? "Out of Stock" : isAdding ? "Adding…" : "🛒 Add"}
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="uh-card-body">
                    <h3 className="uh-card-title">{book.title}</h3>
                    <p className="uh-card-author">by {book.author}</p>
                    <div className="uh-card-bottom">
                      <span className="uh-price">₹{book.price}</span>
                      <span className={`uh-stock-chip ${chip.cls}`}>{chip.label}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ═══ AI INSIGHT MODAL ═══ */}
      {aiModal && (
        <div className="uh-modal-backdrop" onClick={() => setAiModal(null)}>
          <div className="uh-ai-modal" onClick={e => e.stopPropagation()}>
            <div className="uh-modal-header">
              <h3>🤖 AI Smart Summary</h3>
              <button className="uh-modal-close" onClick={() => setAiModal(null)}>✕</button>
            </div>

            <div className="uh-modal-book-row">
              <img
                src={`${API_URL}${aiModal.image}`}
                alt={aiModal.title}
                onError={e => { e.target.src = "https://via.placeholder.com/52x68?text=📚"; }}
              />
              <div>
                <p className="bk-title">{aiModal.title}</p>
                <p className="bk-auth">by {aiModal.author}</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="uh-modal-loading">
                <div className="uh-modal-spinner" />
                <p>Gemini is crafting your summary…</p>
              </div>
            ) : (
              <p className="uh-summary-text">{aiSummary}</p>
            )}

            {!aiLoading && (
              <button className="uh-modal-close-btn" onClick={() => setAiModal(null)}>Close</button>
            )}
          </div>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`uh-toast ${toast.type === "error" ? "error" : ""}`}>
          {toast.msg}
        </div>
      )}

    </div>
  );
}