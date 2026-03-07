import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './Userhome.css';
import API_URL from './config';

// ─── ICON COMPONENTS ───
const SearchIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const BellIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const CartIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const MapIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>;
const SparklesIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>; // using alternative star/magic for simplified path
const MagicIcon = ({ className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.38 13.38L15 2.75a2.12 2.12 0 0 1 3 3L7.38 18.38a2.12 2.12 0 0 1-3-3z"></path><path d="M22 12h-4"></path><path d="M12 2v4"></path><path d="M12 22v-4"></path><path d="M2 12h4"></path></svg>;
const StarIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const BookOpenIcon = ({ className }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const LogOutIcon = ({ className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const UserIcon = ({ className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PackageIcon = ({ className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const ChevronDownIcon = ({ className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const HeartIcon = ({ className, filled }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const InboxIcon = ({ className }) => <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>;
const ChecksIcon = ({ className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 10 11 21 6 16"></polyline></svg>;

const CATEGORIES = ["All", "Fiction", "Self-Help", "Business", "Technology", "Thriller", "Science", "History", "Biography"];
const SORTS = [
  { value: "newest",    label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc",label: "Price: High to Low" },
  { value: "az",        label: "A to Z" },
];

const getStockChip = (qty) => {
  if (qty <= 0) return { label: "Out of Stock", cls: "out" };
  if (qty <= 5) return { label: `${qty} left`, cls: "low", icon: "🔥" };
  return { label: `In Stock`, cls: "in", icon: "✓" };
};

const SkeletonCard = () => (
  <div className="uh-skeleton-card">
    <div className="skel-img"></div>
    <div className="skel-body">
      <div className="skel-line h16 w70"></div>
      <div className="skel-line h12 w50 mt-sm"></div>
      <div className="skel-flex mt-md">
        <div className="skel-line h20 w30"></div>
        <div className="skel-line h16 w20"></div>
      </div>
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
  const [aiModal,       setAiModal]       = useState(null);
  const [aiSummary,     setAiSummary]     = useState("");
  const [aiLoading,     setAiLoading]     = useState(false);

  // Redesign State
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Order Shipped", msg: "Your order #1024 has been shipped and is on its way!", time: "2h ago", unread: true },
    { id: 2, title: "New Release", msg: "A new book in 'Fiction' is available now.", time: "1d ago", unread: true },
    { id: 3, title: "AI Roadmap", msg: "Your new reading roadmap is ready to explore!", time: "2d ago", unread: false }
  ]);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
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

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      default: break;
    }
    return result;
  }, [books, category, search, stockOnly, sort]);

  const toggleWishlist = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(w => w !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    showToast(wishlist.includes(id) ? "Removed from wishlist" : "Added to wishlist");
  };

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
        showToast(`"${book.title}" added to cart!`);
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

  const openAiModal = async (book, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAiModal(book);
    setAiSummary("");
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: book.title || "Unknown", author: book.author || "Unknown" }),
      });
      const data = await res.json();
      setAiSummary(res.ok ? data.summary : (data.error || "AI unavailable. Try again."));
    } catch (err) {
      console.error("AI Summary fetch error:", err);
      setAiSummary("Could not reach the server or request was blocked.");
    } finally {
      setAiLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };
  
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="uh-layout">
      {/* ═══ NAVBAR ═══ */}
      <nav className="uh-navbar">
        <div className="uh-nav-inner flex-between">
          <div className="uh-brand" onClick={() => navigate("/userhome")}>
            <div className="uh-brand-icon"><BookOpenIcon /></div>
            <span className="uh-brand-text">Bookshelf</span>
          </div>

          <div className="uh-search-container">
            <SearchIcon className="uh-search-icon" />
            <input
              type="text"
              className="uh-search-input"
              placeholder="Search by title or author…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
               <button className="uh-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="uh-nav-tools">
            <button className="uh-tool-btn" onClick={() => navigate("/roadmap")} title="Roadmap">
              <MapIcon className="uh-tool-icon" />
            </button>
            <div className="uh-cart-wrapper">
              <button className="uh-tool-btn" onClick={() => navigate("/cart")} title="Cart">
                <CartIcon className="uh-tool-icon" />
                {cartCount > 0 && <span className="uh-badge-indicator accent">{cartCount}</span>}
              </button>
            </div>
            
            {/* Notification Dropdown */}
            <div className="uh-dropdown-wrapper" ref={notifRef}>
              <button className={`uh-tool-btn ${isNotifOpen ? "active" : ""}`} onClick={() => setIsNotifOpen(!isNotifOpen)}>
                <BellIcon className="uh-tool-icon" />
                {unreadCount > 0 && <span className="uh-badge-indicator alert">{unreadCount}</span>}
              </button>
              
              {isNotifOpen && (
                <div className="uh-dropdown-panel notif-panel pb-fade-in">
                  <div className="uh-panel-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="uh-panel-link" onClick={markAllRead}>
                        <ChecksIcon className="icon-sm" /> Mark read
                      </button>
                    )}
                  </div>
                  <div className="uh-panel-content custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={`uh-notif-item ${n.unread ? "unread" : ""}`}>
                          {n.unread && <span className="uh-notif-dot"></span>}
                          <div className="uh-notif-body">
                            <h5>{n.title}</h5>
                            <p>{n.msg}</p>
                            <span className="uh-notif-time">{n.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="uh-empty-state-sm">
                        <BellIcon className="icon-muted" />
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="uh-dropdown-wrapper" ref={profileRef}>
              <button className="uh-user-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <div className="uh-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <ChevronDownIcon className={`icon-sm transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isProfileOpen && (
                <div className="uh-dropdown-panel profile-panel pb-fade-in">
                  <div className="uh-profile-header">
                    <div className="uh-avatar large">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="uh-profile-info">
                      <strong>{user.name}</strong>
                      <span>reader@bookshelf.app</span>
                    </div>
                  </div>
                  <div className="uh-panel-divider"></div>
                  <button className="uh-menu-item" onClick={() => navigate("/profile")}>
                    <UserIcon className="icon-sm" /> My Profile
                  </button>
                  <button className="uh-menu-item" onClick={() => navigate("/adminorders")}>
                    <PackageIcon className="icon-sm" /> My Orders
                  </button>
                  <div className="uh-panel-divider"></div>
                  <button className="uh-menu-item danger" onClick={() => { localStorage.clear(); navigate("/login"); }}>
                    <LogOutIcon className="icon-sm" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="uh-main-content">
        
        {/* HERO BANNER SECTION */}
        <section className="uh-hero">
          <div className="uh-hero-bg">
             <div className="uh-hero-glow primary"></div>
             <div className="uh-hero-glow secondary"></div>
             <div className="uh-hero-noise"></div>
          </div>
          <div className="uh-hero-inner">
            <div className="uh-hero-badge">
              <StarIcon className="icon-xs" /> Gemini 2.5 AI
            </div>
            <h1 className="uh-hero-title">Discover your next favorite book.</h1>
            <p className="uh-hero-subtitle">
              Generate a personalized Reading Roadmap tailored to your goals. Experience our smart AI recommendations and build your dream library.
            </p>
            <div className="uh-hero-actions">
              <button className="uh-btn uh-btn-primary" onClick={() => navigate("/roadmap")}>
                <MagicIcon className="icon-sm" /> Start AI Roadmap
              </button>
              <button className="uh-btn uh-btn-secondary" onClick={() => {
                document.getElementById('books-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                Explore Books
              </button>
            </div>
          </div>
        </section>

        {/* CATALOG SECTION */}
        <section id="books-section" className="uh-catalog">
          <div className="uh-toolbar sticky-toolbar">
            <div className="uh-toolbar-left">
              <h2 className="uh-section-title">
                {category === "All" ? "The Library" : category}
                {!loading && <span className="uh-count-badge">{filteredBooks.length}</span>}
              </h2>
            </div>
            <div className="uh-toolbar-right">
              <label className="uh-toggle">
                <input type="checkbox" checked={stockOnly} onChange={() => setStockOnly(s => !s)} />
                <div className="uh-switch"></div>
                <span className="uh-toggle-label">In-stock only</span>
              </label>
              
              <div className="uh-select-wrapper">
                <select className="uh-select" value={sort} onChange={e => setSort(e.target.value)}>
                  {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDownIcon className="uh-select-icon icon-sm" />
              </div>
            </div>
          </div>

          <div className="uh-category-pills">
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

          <div className="uh-grid-container relative">
            {loading ? (
              <div className="uh-grid pb-fade-in pb-faster">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="uh-empty-state pb-fade-in">
                <div className="uh-empty-icon"><InboxIcon /></div>
                <h3>Nothing found</h3>
                <p>We couldn't find any books matching your criteria. Try altering your filters or search.</p>
                <button className="uh-btn uh-btn-outline mt-sm" onClick={() => { setCategory("All"); setSearch(""); setStockOnly(false); }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="uh-grid pb-fade-in">
                {filteredBooks.map(book => {
                  const chip = getStockChip(book.quantity);
                  const wished = wishlist.includes(book._id);
                  const isAdding = addingId === book._id;
                  return (
                    <div key={book._id} className="uh-card group">
                      <div className="uh-card-header">
                        <button
                          className={`uh-wishlist-btn ${wished ? "active" : ""}`}
                          onClick={(e) => { e.preventDefault(); toggleWishlist(book._id); }}
                        >
                          <HeartIcon className="icon-sm" filled={wished} />
                        </button>
                        
                        <div className="uh-image-container">
                          <img
                            src={`${API_URL}${book.image}`}
                            alt={book.title}
                            className="uh-cover-image"
                            onError={e => { e.target.src = "https://via.placeholder.com/260x360?text=Cover"; }}
                          />
                          <div className="uh-overlay">
                            <button className="uh-btn uh-btn-glass" onClick={(e) => openAiModal(book, e)}>
                              <StarIcon className="icon-sm" /> AI Summary
                            </button>
                          </div>
                          <span className="uh-category-tag">{book.category}</span>
                        </div>
                      </div>

                      <div className="uh-card-content">
                        <h3 className="uh-book-title" title={book.title}>{book.title}</h3>
                        <p className="uh-book-author">by {book.author}</p>
                        
                        <div className="uh-card-footer">
                          <div className="uh-price-wrap">
                            <span className="uh-price">₹{book.price}</span>
                            <span className={`uh-status-chip ${chip.cls}`}>
                              {chip.icon && <span className="mr-1">{chip.icon}</span>}
                              {chip.label}
                            </span>
                          </div>
                        </div>

                        <button
                          className={`uh-add-cart-btn ${isAdding ? "loading" : ""}`}
                          onClick={() => addToCart(book)}
                          disabled={book.quantity <= 0 || isAdding}
                        >
                          {book.quantity <= 0 ? (
                            "Sold Out"
                          ) : isAdding ? (
                            <span className="uh-spinner-sm"></span>
                          ) : (
                            <><span>Add to Cart</span> <CartIcon className="icon-xs ml-1 transition-transform group-hover:translate-x-1" /></>
                          )}
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ═══ AI INSIGHT MODAL ═══ */}
      {aiModal && (
        <div className="uh-modal-overlay pb-fade-in pb-faster" onClick={() => setAiModal(null)}>
          <div className="uh-modal-glass pb-scale-in pb-faster" onClick={e => e.stopPropagation()}>
            <div className="uh-modal-header">
              <div className="flex-center gap-sm">
                <div className="icon-box-purple"><MagicIcon className="icon-sm" /></div>
                <h3>AI Insights</h3>
              </div>
              <button className="uh-modal-close" onClick={() => setAiModal(null)}>✕</button>
            </div>

            <div className="uh-modal-ctx">
               <img src={`${API_URL}${aiModal.image}`} alt={aiModal.title} className="uh-modal-thumb" onError={e => { e.target.src = "https://via.placeholder.com/64x80?text=📚" }}/>
               <div className="uh-modal-ctx-info">
                 <h4 className="line-clamp-1">{aiModal.title}</h4>
                 <p>{aiModal.author}</p>
               </div>
            </div>

            <div className="uh-modal-body">
              {aiLoading ? (
                <div className="uh-loading-state">
                  <div className="uh-spinner gradient"></div>
                  <p>Analyzing book contents...</p>
                </div>
              ) : (
                <div className="uh-summary-box">
                  <p>{aiSummary}</p>
                </div>
              )}
            </div>
            
            {!aiLoading && (
              <div className="uh-modal-footer">
                <button className="uh-btn uh-btn-outline full-width" onClick={() => setAiModal(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`uh-toast pb-slide-up pb-faster ${toast.type === "error" ? "error" : ""}`}>
          <div className="uh-toast-icon">
            {toast.type === "error" ? "!" : <ChecksIcon className="icon-sm" />}
          </div>
          <p>{toast.msg}</p>
        </div>
      )}
    </div>
  );
}