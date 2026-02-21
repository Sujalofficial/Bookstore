import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminOrders.css";
import API_URL from "./config";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch Orders on Load
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/adminlogin");

    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        // Backend se { orders, totalRevenue } aa raha hai, humein sirf orders chahiye
        setOrders(data.orders || []);
      } else {
        alert("Failed to load orders");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Status Update Function
  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Optimistic UI Update (Turant rang badal jayega bina refresh ke)
        setOrders(orders.map(order => 
            order._id === id ? { ...order, status: newStatus } : order
        ));
        alert(`✅ Order Marked as ${newStatus}`);
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Server Error");
    }
  };

  // Helper for Status Color Class
  const getStatusClass = (status) => {
    switch(status) {
        case 'Shipped': return 'status-shipped';
        case 'Delivered': return 'status-delivered';
        case 'Cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
  };

  if (loading) return <div className="loading-container">🔄 Loading Orders...</div>;

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
            <h2>📦 Order Management</h2>
            <p>Track and manage customer shipments</p>
        </div>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>⬅ Back to Dashboard</button>
      </div>

      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items Ordered</th>
              <th>Amount</th>
              <th>Address</th>
              <th>Status Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id}>
                  {/* ID */}
                  <td><span className="id-badge">#{order._id.slice(-6).toUpperCase()}</span></td>
                  
                  {/* Customer Info */}
                  <td>
                    <div className="customer-name">{order.customerName}</div>
                    <div className="order-date">{new Date(order.orderedAt).toLocaleDateString()}</div>
                  </td>

                  {/* Items List */}
                  <td>
                    <div className="items-wrapper">
                        {order.books.map((b, i) => (
                            <div key={i} className="item-row">
                                <span>📘 {b.title}</span>
                                <span className="qty-tag">x{b.quantity}</span>
                            </div>
                        ))}
                    </div>
                  </td>

                  {/* Total Price */}
                  <td className="price-cell">₹{order.totalAmount}</td>

                  {/* Address */}
                  <td className="address-cell">{order.address}</td>

                  {/* Status Dropdown */}
                  <td>
                    <select 
                        className={`status-select ${getStatusClass(order.status)}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                        <option value="Pending">🕒 Pending</option>
                        <option value="Shipped">🚚 Shipped</option>
                        <option value="Delivered">✅ Delivered</option>
                        <option value="Cancelled">❌ Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No orders found yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}