import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API_URL from './config';

const STATUS_ORDER = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

const TIMELINE_STEPS = [
  { key: 'Placed',     label: 'Order Placed',   desc: 'Customer successfully placed the order.',    icon: '🛒' },
  { key: 'Processing', label: 'Processing',     desc: 'Payment confirmed, preparing for shipment.', icon: '⚙️' },
  { key: 'Shipped',    label: 'Shipped',         desc: 'Package dispatched and on its way.',         icon: '🚚' },
  { key: 'Delivered',  label: 'Delivered',       desc: 'Package delivered to the customer.',         icon: '✅' },
];

function getTimelineIndex(status) {
  if (status === 'Cancelled') return -1;
  if (status === 'Delivered') return 3;
  if (status === 'Shipped')   return 2;
  if (status === 'Pending')   return 1;
  return 0;
}

export default function AdminOrders() {
  const navigate     = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast,      setToast]      = useState(null);
  const [updating,   setUpdating]   = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let result = [...orders];
    if (statusFilter !== 'All') result = result.filter(o => o.status === statusFilter);
    if (search.trim()) result = result.filter(o =>
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o._id.slice(-6).toUpperCase().includes(search.toUpperCase())
    );
    setFiltered(result);
  }, [orders, statusFilter, search]);

  const fetchOrders = async (isRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setOrders(data.orders || []); }
      else if (res.status === 401 || res.status === 403) navigate('/adminlogin');
    } catch (err) { showToast('Network error. Try again.', 'error'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    setUpdating(id);
    try {
      const res  = await fetch(`${API_URL}/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
        if (selectedOrder?._id === id) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        showToast(`✅ Order marked as ${newStatus}`, 'success');
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setUpdating(null); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const statusCounts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {});
  const tlIndex = selectedOrder ? getTimelineIndex(selectedOrder.status) : -1;

  return (
    <AdminLayout
      title="Order Management"
      subtitle={`${orders.length} total orders · ₹${totalRevenue.toLocaleString('en-IN')} revenue`}
      onRefresh={() => fetchOrders(true)}
      refreshing={refreshing}
    >
      {/* Mini stat row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending',   val: statusCounts.Pending,   cls: 'amber', emoji: '🕒' },
          { label: 'Shipped',   val: statusCounts.Shipped,   cls: 'blue',  emoji: '🚚' },
          { label: 'Delivered', val: statusCounts.Delivered, cls: 'green', emoji: '✅' },
          { label: 'Cancelled', val: statusCounts.Cancelled, cls: 'red',   emoji: '❌' },
        ].map(s => (
          <div
            key={s.label}
            className={`ap-stat-card ${s.cls}`}
            style={{ flex: '1 1 130px', padding: '14px 16px', cursor: 'pointer' }}
            onClick={() => setStatusFilter(statusFilter === s.label ? 'All' : s.label)}
          >
            <div className={`ap-stat-icon ${s.cls}`} style={{ width: 36, height: 36 }}>{s.emoji}</div>
            <div>
              <div className="ap-stat-label">{s.label}</div>
              <div className="ap-stat-value" style={{ fontSize: 22 }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="ap-card">
        <div className="ap-card-header">
          <span className="ap-card-title">
            {statusFilter !== 'All' ? `${statusFilter} Orders` : 'All Orders'}
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>{filtered.length} shown</span>
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#f9fafb' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="ap-search-input"
              placeholder="🔍 Search customer / order ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="ap-loading"><div className="ap-spinner"/><p>Loading orders…</p></div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty"><div className="ap-empty-icon">📭</div><h3>No orders found</h3><p>Try changing your filters.</p></div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Books</th>
                <th>Total</th>
                <th>Address</th>
                <th>Date</th>
                <th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view order timeline"
                  >
                    <td><span style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="ap-avatar">{(order.customerName || 'U')[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{order.customerName || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {order.books.map((b, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#374151' }}>
                            📘 {b.title} <span style={{ color: '#9ca3af' }}>×{b.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#4f46e5' }}>₹{order.totalAmount}</td>
                    <td style={{ maxWidth: 140, fontSize: 12, color: '#6b7280' }}>{order.address || '—'}</td>
                    <td style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(order.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className={`ap-status-select ${order.status?.toLowerCase()}`}
                        value={order.status || 'Pending'}
                        onChange={e => handleStatusChange(order._id, e.target.value)}
                        disabled={updating === order._id}
                      >
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ORDER TIMELINE DRAWER ─── */}
      {selectedOrder && (
        <>
          <div className="ap-drawer-backdrop" onClick={() => setSelectedOrder(null)} />
          <div className="ap-drawer">
            <div className="ap-drawer-header">
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order Details</div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#0f0c29' }}>#{selectedOrder._id.slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {new Date(selectedOrder.orderedAt).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <button className="ap-drawer-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="ap-drawer-body">

              {/* Customer info */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #eef0f6' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Customer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ap-avatar" style={{ width: 38, height: 38, fontSize: 16 }}>{(selectedOrder.customerName || 'U')[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14 }}>{selectedOrder.customerName}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{selectedOrder.address}</div>
                  </div>
                </div>
              </div>

              {/* Books */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Books Ordered</div>
                {selectedOrder.books.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📘</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e1b4b' }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>×{b.quantity}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: 13 }}>₹{b.price * b.quantity}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '2px solid #eef0f6' }}>
                  <span style={{ fontWeight: 700, color: '#1e1b4b' }}>Total</span>
                  <span style={{ fontWeight: 900, color: '#4f46e5', fontSize: 16 }}>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Order Timeline</div>
                {selectedOrder.status === 'Cancelled' ? (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
                    ❌ This order has been cancelled.
                  </div>
                ) : (
                  <div className="ap-timeline">
                    {TIMELINE_STEPS.map((step, i) => {
                      const isDone   = i < tlIndex;
                      const isActive = i === tlIndex;
                      return (
                        <div key={step.key} className="ap-tl-step" style={{ animationDelay: `${i * 0.08}s` }}>
                          <div className={`ap-tl-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                            {isDone ? '✓' : ''}
                          </div>
                          <div className={`ap-tl-label ${!isDone && !isActive ? 'muted' : ''}`}>
                            {step.icon} {step.label}
                            {isActive && (
                              <span style={{ marginLeft: 8, fontSize: 10, background: '#eef2ff', color: '#4f46e5', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Current</span>
                            )}
                          </div>
                          <div className="ap-tl-desc">{step.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Change status from drawer */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Update Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_ORDER.map(s => (
                    <button
                      key={s}
                      className={`ap-btn ${selectedOrder.status === s ? 'primary' : 'subtle'}`}
                      style={{ fontSize: 12 }}
                      onClick={() => handleStatusChange(selectedOrder._id, s)}
                      disabled={updating === selectedOrder._id}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <div className={`ap-toast ${toast.type}`}>{toast.msg}</div>}
    </AdminLayout>
  );
}