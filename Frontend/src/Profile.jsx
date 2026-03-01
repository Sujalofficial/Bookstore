import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import API_URL from './config';

const STATUS_MAP = {
  Pending:   "pending",
  Shipped:   "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const OrderSkeleton = () => (
  <div className="pf-order-skeleton">
    <div className="pf-skel" style={{ height: 14, width: "40%" }} />
    <div className="pf-skel" style={{ height: 12, width: "25%" }} />
    <div className="pf-skel" style={{ height: 60, borderRadius: 10 }} />
    <div className="pf-skel" style={{ height: 14, width: "30%" }} />
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="pf-wrapper">

      {/* ═══ NAV ═══ */}
      <nav className="pf-nav">
        <div className="pf-logo" onClick={() => navigate("/userhome")}>BOOK<span>SHELF</span>.</div>
        <div className="pf-nav-right">
          <button className="pf-nav-link" onClick={() => navigate("/userhome")}>🏠 Home</button>
          <button className="pf-nav-link" onClick={() => navigate("/cart")}>🛒 Cart</button>
          <button className="pf-nav-link" onClick={() => navigate("/roadmap")}>🗺️ Roadmap</button>
          <button className="pf-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="pf-main">
        <div className="pf-layout">

          {/* ─── LEFT SIDEBAR ─── */}
          <aside className="pf-sidebar">

            {/* Profile card */}
            <div className="pf-card">
              <div className="pf-card-hero">
                <div className="pf-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <h2 className="pf-name">{user.name}</h2>
                <span className="pf-role-badge">{user.isAdmin ? "Administrator" : "Verified Reader"}</span>
              </div>
              <div className="pf-card-body">
                <div className="pf-info-row">
                  <div className="pf-info-icon">✉️</div>
                  <div>
                    <p className="pf-info-label">Email</p>
                    <p className="pf-info-value">{user.email}</p>
                  </div>
                </div>
                <div className="pf-info-row">
                  <div className="pf-info-icon">🪪</div>
                  <div>
                    <p className="pf-info-label">Member ID</p>
                    <p className="pf-info-value">#{user._id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="pf-info-row">
                  <div className="pf-info-icon">📅</div>
                  <div>
                    <p className="pf-info-label">Account Type</p>
                    <p className="pf-info-value">{user.isAdmin ? "Admin" : "Customer"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats card */}
            {!loading && (
              <div className="pf-stats-card">
                <div className="pf-stat">
                  <span className="pf-stat-num">{orders.length}</span>
                  <span className="pf-stat-lbl">Orders</span>
                </div>
                <div className="pf-stat-divider" />
                <div className="pf-stat">
                  <span className="pf-stat-num">
                    {orders.filter(o => o.status === "Delivered").length}
                  </span>
                  <span className="pf-stat-lbl">Delivered</span>
                </div>
                <div className="pf-stat-divider" />
                <div className="pf-stat">
                  <span className="pf-stat-num">₹{totalSpent}</span>
                  <span className="pf-stat-lbl">Spent</span>
                </div>
              </div>
            )}
          </aside>

          {/* ─── RIGHT: ORDER HISTORY ─── */}
          <section className="pf-orders-col">
            <div className="pf-section-header">
              <h2 className="pf-section-title">📦 Order History</h2>
              {!loading && <span className="pf-order-count">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>}
            </div>

            {loading ? (
              <>
                <OrderSkeleton />
                <OrderSkeleton />
                <OrderSkeleton />
              </>
            ) : orders.length === 0 ? (
              <div className="pf-no-orders">
                <div className="pf-no-orders-icon">📭</div>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders. Start your reading journey today!</p>
                <button className="pf-shop-btn" onClick={() => navigate("/userhome")}>Browse Books 📚</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order._id} className="pf-order-card">
                  <div className="pf-order-top">
                    <div>
                      <h3 className="pf-order-id">Order #{order._id.slice(-6).toUpperCase()}</h3>
                      <p className="pf-order-date">
                        {new Date(order.orderedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`pf-status ${STATUS_MAP[order.status] || "pending"}`}>
                      {order.status || "Pending"}
                    </span>
                  </div>

                  <div className="pf-order-books">
                    {order.books.map((book, i) => (
                      <div key={i} className="pf-order-book-row">
                        <span className="pf-book-name">📘 {book.title}</span>
                        <span className="pf-book-qty">×{book.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pf-order-bottom">
                    <span className="pf-order-total">₹{order.totalAmount}</span>
                  </div>
                </div>
              ))
            )}
          </section>

        </div>
      </main>
    </div>
  );
}