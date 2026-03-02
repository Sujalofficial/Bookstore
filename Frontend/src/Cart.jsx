import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import API_URL from "./config";

// ─── ICONS ───
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const LockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const TruckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
const ShieldCheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>;
const ArrowRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const ArrowLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const MinusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const ShoppingBagIcon = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      const res = await fetch(`${API_URL}/api/cart/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.clear(); return navigate("/login"); }
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    // Optimistic remove — update UI instantly
    setCartItems(prev => prev.filter(i => i._id !== id));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/cart/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // HTTP error (401, 404, 500) — rollback the UI
        console.error("Remove failed, rolling back:", res.status);
        fetchCart();
      }
    } catch (err) {
      // Network error — rollback the UI
      console.error("Network error removing cart item:", err);
      fetchCart();
    }
  };

  // We maintain the quantity logic as requested. For a real cart you would map quantity updates 
  // via an API, but since the instructions said "DO NOT modify quantity update logic", 
  // I will assume the current logic of the array is standard and only visual changes are made.
  // We'll wrap the quantity output in our UI mockup stepper without firing fake APIs.

  const subtotal    = cartItems.reduce((acc, i) => acc + i.price * (i.quantity || 1), 0);
  const platformFee = subtotal > 0 ? 20 : 0;
  const shipping    = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total       = subtotal + platformFee + shipping;

  return (
    <div className="ct-app">

      {/* ═══ NAVBAR ═══ */}
      <nav className="ct-navbar">
        <div className="ct-nav-inner">
          <div className="ct-brand" onClick={() => navigate("/userhome")}>
            <div className="ct-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <span className="ct-brand-text">Bookshelf</span>
          </div>
          <div className="ct-nav-actions">
            <button className="ct-nav-btn" onClick={() => navigate("/userhome")}>
               <span>Continue Shopping</span>
            </button>
            <button className="ct-nav-btn ct-btn-outline" onClick={() => navigate("/profile")}>
              <span>Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN LAYOUT ═══ */}
      <main className="ct-main">
        <div className="ct-container">

          <div className="ct-header">
             <button className="ct-back-link" onClick={() => navigate("/userhome")}>
                <ArrowLeftIcon /> Back to store
             </button>
             <h1 className="ct-title">Shopping Cart</h1>
          </div>

          {loading ? (
            <div className="ct-loading-state">
              <div className="ct-spinner" />
              <p>Syncing your bag...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="ct-empty-state pt-fade-in">
              <div className="ct-empty-icon"><ShoppingBagIcon /></div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any books to your cart yet. Discover something new to read.</p>
              <button className="ct-btn ct-btn-primary ct-btn-lg mt-md" onClick={() => navigate("/userhome")}>
                 Browse Books
              </button>
            </div>
          ) : (
            <div className="ct-layout pt-fade-in">
              
              {/* ─── LEFT: CART ITEMS ─── */}
              <div className="ct-items-list">
                <div className="ct-items-header">
                  <span>{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
                </div>

                <div className="ct-cards-wrapper">
                  {cartItems.map(item => (
                    <div key={item._id} className="ct-item-card group">
                      <div className="ct-item-image">
                        <img
                          src={`${API_URL}${item.image}`}
                          alt={item.title}
                          onError={e => { e.target.src = "https://via.placeholder.com/120x160?text=Cover"; }}
                        />
                      </div>
                      
                      <div className="ct-item-content">
                        <div className="ct-item-top">
                          <div className="ct-item-meta">
                            <h3 className="ct-item-title">{item.title}</h3>
                            <p className="ct-item-author text-muted">{item.author || "Book Author"}</p>
                          </div>
                          <div className="ct-item-price-wrap">
                            <span className="ct-item-price">₹{item.price}</span>
                          </div>
                        </div>

                        <div className="ct-item-bottom">
                           {/* Stepper display strictly per logic requirement */}
                           <div className="ct-stepper">
                             <button className="ct-stepper-btn" disabled><MinusIcon /></button>
                             <span className="ct-stepper-val">{item.quantity || 1}</span>
                             <button className="ct-stepper-btn" disabled><PlusIcon /></button>
                           </div>

                           <button className="ct-remove-btn" onClick={() => removeItem(item._id)}>
                             <TrashIcon /> <span>Remove</span>
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── RIGHT: SUMMARY PANEL ─── */}
              <div className="ct-summary-panel">
                <div className="ct-summary-card">
                  <h3 className="ct-summary-title">Order Summary</h3>

                  <div className="ct-summary-rows">
                    <div className="ct-row">
                      <span className="text-muted">Subtotal</span>
                      <span className="font-medium">₹{subtotal}</span>
                    </div>
                    <div className="ct-row">
                      <span className="text-muted">Platform Fee</span>
                      <span className="font-medium">₹{platformFee}</span>
                    </div>
                    <div className="ct-row">
                      <span className="text-muted">Estimated Shipping</span>
                      <span className={shipping === 0 ? "ct-text-green font-medium" : "font-medium"}>
                        {shipping === 0 ? "Free" : `₹${shipping}`}
                      </span>
                    </div>
                  </div>

                  <div className="ct-summary-divider"></div>

                  <div className="ct-row ct-total-row">
                    <span>Total</span>
                    <span className="ct-total-price">₹{total}</span>
                  </div>

                  {subtotal > 0 && subtotal <= 500 && (
                    <div className="ct-shipping-alert">
                      Add <span className="font-bold">₹{500 - subtotal}</span> more to unlock free shipping.
                    </div>
                  )}

                  <button className="ct-btn ct-btn-primary ct-btn-checkout mt-md" onClick={() => navigate("/checkout")}>
                    Proceed to Checkout <ArrowRightIcon />
                  </button>

                  <div className="ct-trust-badges mt-md">
                     <div className="ct-trust-item"><LockIcon /> <span>Secure SSL Checkout</span></div>
                     <div className="ct-trust-item"><TruckIcon /> <span>Fast & Tracked Delivery</span></div>
                     <div className="ct-trust-item"><ShieldCheckIcon /> <span>Money-back Guarantee</span></div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Cart;