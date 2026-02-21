import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import API_URL from './config';

export default function Profile() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Get User from LocalStorage
    const user = JSON.parse(localStorage.getItem('user'));

    // 2. Fetch Orders on Load
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchMyOrders();
    }, [navigate, user]);

    const fetchMyOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setOrders(data);
            }
        } catch (err) {
            console.error("Error fetching orders");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Helper for Status Colors
    const getStatusColor = (status) => {
        switch (status) {
            case "Shipped": return "badge-blue";
            case "Delivered": return "badge-green";
            case "Cancelled": return "badge-red";
            default: return "badge-yellow"; // Pending
        }
    };

    if (!user) return null;

    return (
        <div className="main-wrapper">
            <nav className="navbar">
                <div className="nav-logo" onClick={() => navigate("/userhome")} style={{ cursor: 'pointer' }}>BOOKSHELF.</div>
                <div className="nav-links">
                    <span className="nav-item" onClick={() => navigate("/userhome")}>Home</span>
                    <span className="nav-item" onClick={() => navigate("/cart")}>🛒 Cart</span>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-container">
                <div className="profile-layout">
                    
                    {/* --- LEFT: USER CARD --- */}
                    <aside className="profile-sidebar">
                        <div className="profile-card">
                            <div className="profile-header">
                                <div className="avatar-circle">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <h2>{user.name}</h2>
                                <span className="badge">{user.isAdmin ? "Administrator" : "Verified Reader"}</span>
                            </div>
                            <div className="profile-body">
                                <div className="info-group">
                                    <label>Email</label>
                                    <p>{user.email}</p>
                                </div>
                                <div className="info-group">
                                    <label>Member ID</label>
                                    <p className="id-text">#{user._id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                            <button className="edit-profile-btn">Edit Details</button>
                        </div>
                    </aside>

                    {/* --- RIGHT: ORDER HISTORY --- */}
                    <section className="orders-section">
                        <h2 className="section-title">📦 Order History</h2>
                        
                        {loading ? (
                            <p>Loading orders...</p>
                        ) : orders.length > 0 ? (
                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div key={order._id} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <span className="order-date">Ordered: {new Date(order.orderedAt).toLocaleDateString()}</span>
                                                <div className="order-id">Order #{order._id.slice(-6).toUpperCase()}</div>
                                            </div>
                                            <div className={`status-badge ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </div>
                                        </div>
                                        
                                        <div className="order-items-preview">
                                            {order.books.map((book, i) => (
                                                <div key={i} className="mini-item">
                                                    <span>📘 {book.title}</span>
                                                    <span className="mini-qty">x{book.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <span className="total-price">Total: ₹{order.totalAmount}</span>
                                            <button className="track-btn">Track Order</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-orders-box">
                                <p>You haven't placed any orders yet.</p>
                                <button onClick={() => navigate("/userhome")}>Start Shopping</button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}