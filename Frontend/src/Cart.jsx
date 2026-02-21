import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import API_URL from "./config";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const res = await fetch(`${API_URL}/api/cart/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.clear();
        return navigate("/login");
      }

      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await fetch(`${API_URL}/api/cart/${id}`, { method: "DELETE" });
      setCartItems(cartItems.filter((item) => item._id !== id));
    } catch (err) {
      alert("Error removing item");
    }
  };

  // Calculations
  const subtotal = Array.isArray(cartItems) 
    ? cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0) 
    : 0;
  
  const platformFee = subtotal > 0 ? 20 : 0; 
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40; 
  const total = subtotal + platformFee + shipping;

  if (loading) return <div className="loader-container"><div className="loader"></div><p>Syncing your bag...</p></div>;

  return (
    <div className="main-wrapper">
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/userhome")} style={{cursor: 'pointer'}}>BOOKSHELF.</div>
        <div className="nav-links">
          <span className="nav-item" onClick={() => navigate("/userhome")}>Continue Shopping</span>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
        </div>
      </nav>

      <main className="dashboard-container">
        <div className="cart-header">
          <h1>My Shopping Bag ({cartItems.length} items)</h1>
        </div>

        {cartItems.length > 0 ? (
          <div className="cart-grid">
            {/* --- LEFT: PRODUCT LIST --- */}
            <div className="cart-items-section">
              {cartItems.map((item) => (
                <div key={item._id} className="pro-cart-item">
                  <img src={`${API_URL}${item.image}`} alt={item.title} className="cart-prod-img" 
                       onError={(e) => e.target.src = 'https://via.placeholder.com/100'} />
                  <div className="cart-prod-details">
                    <div className="prod-header">
                      <h3>{item.title}</h3>
                      <button className="delete-icon-btn" onClick={() => removeItem(item._id)}>🗑️</button>
                    </div>
                    <p className="prod-price">₹{item.price}</p>
                    <div className="prod-footer">
                      <span className="qty-badge">Qty: {item.quantity || 1}</span>
                      <p className="item-subtotal">Item Total: ₹{item.price * (item.quantity || 1)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- RIGHT: ORDER SUMMARY --- */}
            <div className="order-summary-container">
              <div className="summary-card">
                <h3>Order Summary</h3>
                <div className="summary-line">
                  <span>Bag Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-line">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="summary-line">
                  <span>Shipping Charges</span>
                  <span className={shipping === 0 ? "free-text" : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                <hr />
                <div className="summary-line total-line">
                  <span>Order Total</span>
                  <span>₹{total}</span>
                </div>
                
                <div className="checkout-offers">
                   <p>✨ 100% Secure Payments</p>
                   <p>🚚 Fast Delivery in 3-5 days</p>
                </div>

                {/* 👇 UPDATED BUTTON: Links to Checkout Page */}
                <button 
                  className="pro-checkout-btn" 
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-cart-ui">
            <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="empty" width="150" />
            <h2>Your bag is looking a bit light!</h2>
            <p>Add some books to your collection and start your reading journey.</p>
            <button className="add-btn" onClick={() => navigate("/userhome")} style={{width: '200px', marginTop: '20px'}}>
              Browse Books
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;