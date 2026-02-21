import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css';
import API_URL from './config';

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/cart/items`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCartItems(data);
          const total = data.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          setTotalPrice(total);
        }
      } catch (err) {
        console.error("Cart Error", err);
      }
    };
    fetchCart();
  }, [navigate]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address || !name) {
      alert("Please fill in all details!");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          customerName: name, 
          address: address 
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("🎉 Order Placed Successfully!");
        navigate('/userhome');
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Server Error. Try again.");
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
      {/* --- 🛠️ NAVBAR ADDED HERE --- */}
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
      <div className="content-container">
        {cartItems.length === 0 ? (
          <div className="empty-msg">
            <h2>Your Cart is Empty! 🛒</h2>
            <p>Go back to home to add some amazing books.</p>
            <button className="ai-btn" onClick={() => navigate("/userhome")}>Start Shopping</button>
          </div>
        ) : (
          <div className="checkout-container">
            <h2 className="page-title">🛍️ Checkout & Payment</h2>
            
            <div className="checkout-layout">
              {/* LEFT SIDE: Form */}
              <div className="shipping-section">
                <h3>Shipping Details</h3>
                <form id="order-form" onSubmit={handlePlaceOrder}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Delivery Address</label>
                    <textarea 
                      rows="3" 
                      placeholder="House No, Street, City, Pincode" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      required 
                    ></textarea>
                  </div>

                  <div className="payment-method">
                    <h3>Payment Method</h3>
                    <div className="payment-option selected">
                      <span>💵</span> Cash on Delivery (COD)
                    </div>
                    <div className="payment-option disabled">
                      <span>💳</span> Online Payment (Coming Soon)
                    </div>
                  </div>
                </form>
              </div>

              {/* RIGHT SIDE: Order Summary */}
              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-items">
                  {cartItems.map(item => (
                    <div key={item._id} className="summary-row">
                      <span>{item.title} (x{item.quantity})</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <hr />
                
                <div className="total-row">
                  <span>Total Payable:</span>
                  <span className="grand-total">₹{totalPrice}</span>
                </div>

                <button 
                  type="submit" 
                  form="order-form" 
                  className="place-order-btn" 
                  disabled={loading}
                >
                  {loading ? "Placing Order..." : "Confirm Order ✅"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;