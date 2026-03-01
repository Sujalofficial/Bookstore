import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import API_URL from "./config";

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
    // Optimistic remove
    setCartItems(prev => prev.filter(i => i._id !== id));
    try {
      await fetch(`${API_URL}/api/cart/${id}`, { method: "DELETE" });
    } catch {
      fetchCart(); // Rollback on error
    }
  };

  const subtotal    = cartItems.reduce((acc, i) => acc + i.price * (i.quantity || 1), 0);
  const platformFee = subtotal > 0 ? 20 : 0;
  const shipping    = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total       = subtotal + platformFee + shipping;

  return (
    <div className="cart-wrapper">

      {/* ═══ NAV ═══ */}
      <nav className="cart-nav">
        <div className="cart-nav-logo" onClick={() => navigate("/userhome")}>
          BOOK<span>SHELF</span>.
        </div>
        <div className="cart-nav-right">
          <button className="cart-nav-link" onClick={() => navigate("/userhome")}>← Continue Shopping</button>
          <button className="cart-nav-link" onClick={() => navigate("/profile")}>👤 Profile</button>
          <button className="cart-logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="cart-main">

        {loading ? (
          <div className="cart-loading">
            <div className="cart-spinner" />
            <p>Syncing your bag…</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="cart-empty">
            <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="empty cart" />
            <h2>Your bag is empty!</h2>
            <p>Looks like you haven't added any books yet. Start exploring our collection!</p>
            <button className="cart-empty-btn" onClick={() => navigate("/userhome")}>Browse Books 📚</button>
          </div>
        ) : (
          <>
            <h1 className="cart-page-title">My Shopping Bag</h1>
            <p className="cart-page-subtitle">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart</p>

            <div className="cart-layout">

              {/* ─── Left: Items ─── */}
              <div className="cart-items-col">
                {cartItems.map(item => (
                  <div key={item._id} className="cart-item-card">
                    <img
                      src={`${API_URL}${item.image}`}
                      alt={item.title}
                      className="cart-item-img"
                      onError={e => { e.target.src = "https://via.placeholder.com/72x96?text=📚"; }}
                    />
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <h3 className="cart-item-title">{item.title}</h3>
                        <button className="cart-item-remove" onClick={() => removeItem(item._id)} title="Remove">🗑️</button>
                      </div>
                      <p className="cart-item-price">₹{item.price}</p>
                      <div className="cart-item-bottom">
                        <span className="cart-qty-badge">Qty: {item.quantity || 1}</span>
                        <span className="cart-item-total">Subtotal: ₹{item.price * (item.quantity || 1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Right: Summary ─── */}
              <div className="cart-summary-col">
                <div className="cart-summary-card">
                  <h3 className="cart-summary-title">Order Summary</h3>

                  <div className="summary-row">
                    <span>Bag Subtotal ({cartItems.length} items)</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="summary-row">
                    <span>Platform Fee</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "free-tag" : ""}>
                      {shipping === 0 ? "FREE 🎉" : `₹${shipping}`}
                    </span>
                  </div>
                  {subtotal > 0 && subtotal <= 500 && (
                    <div style={{ fontSize: 12, color: "#059669", marginBottom: 8, fontWeight: 500 }}>
                      Add ₹{500 - subtotal} more for free shipping!
                    </div>
                  )}
                  <div className="summary-row total">
                    <span>Order Total</span>
                    <span>₹{total}</span>
                  </div>

                  <div className="cart-trust-badges">
                    <div className="trust-item">✅ 100% Secure & Encrypted Payments</div>
                    <div className="trust-item">🚚 Fast Delivery in 3–5 Business Days</div>
                    <div className="trust-item">↩️ Easy Returns within 7 Days</div>
                  </div>

                  <button className="cart-checkout-btn" onClick={() => navigate("/checkout")}>
                    Proceed to Checkout →
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Cart;