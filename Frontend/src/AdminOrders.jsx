import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API_URL from './config';

const STATUS_ORDER = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

const Icons = {
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  )
};

export default function AdminOrders() {
  const navigate     = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating,   setUpdating]   = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let result = [...orders];
    if (statusFilter !== 'All') result = result.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(o =>
        o.customerName?.toLowerCase().includes(s) ||
        o._id.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [orders, statusFilter, search]);

  const fetchOrders = async (isRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) { console.error(err); }
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
      }
    } catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const statusCounts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {});

  return (
    <AdminLayout
      title="Orders"
      subtitle={`${orders.length} total orders placed`}
      onRefresh={() => fetchOrders(true)}
      refreshing={refreshing}
    >
      <div className="animate-fade-in">
        {/* Quick Stats */}
        <div className="ap-stats-grid">
          <div className="ap-stat-card">
            <div className="ap-stat-label">Total Revenue</div>
            <div className="ap-stat-value">₹{totalRevenue.toLocaleString()}</div>
            <div className="ap-stat-sub up">Overall Earnings</div>
          </div>
          <div className="ap-stat-card" onClick={() => setStatusFilter('Pending')} style={{ cursor: 'pointer' }}>
            <div className="ap-stat-label">Pending</div>
            <div className="ap-stat-value">{statusCounts.Pending || 0}</div>
            <div className="ap-stat-sub">Needs Processing</div>
          </div>
          <div className="ap-stat-card" onClick={() => setStatusFilter('Shipped')} style={{ cursor: 'pointer' }}>
            <div className="ap-stat-label">Shipped</div>
            <div className="ap-stat-value">{statusCounts.Shipped || 0}</div>
            <div className="ap-stat-sub">In Transit</div>
          </div>
          <div className="ap-stat-card" onClick={() => setStatusFilter('Delivered')} style={{ cursor: 'pointer' }}>
            <div className="ap-stat-label">Delivered</div>
            <div className="ap-stat-value">{statusCounts.Delivered || 0}</div>
            <div className="ap-stat-sub">Completion Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="ap-card">
          <div className="ap-card-header">
            <div className="ap-card-title">Order Directory</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                className="ap-search-input" 
                placeholder="Search orders..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select 
                className="ap-select" 
                style={{ width: 140 }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Loading orders...</div>
          ) : (
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order._id} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600, color: '#888' }}>#{order._id.slice(-6).toUpperCase()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="ap-avatar-sm" style={{ width: 24, height: 24, fontSize: 10 }}>{(order.customerName || 'U')[0]}</div>
                          <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        </div>
                      </td>
                      <td>{order.books?.length || 0} books</td>
                      <td style={{ fontWeight: 700 }}>₹{order.totalAmount}</td>
                      <td style={{ color: '#888' }}>{new Date(order.orderedAt).toLocaleDateString()}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <span className={`ap-badge ${order.status?.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <>
          <div className="ap-drawer-backdrop" onClick={() => setSelectedOrder(null)} />
          <div className="ap-drawer">
            <div className="ap-drawer-header">
              <div>
                <div className="ap-page-title">Order #{selectedOrder._id.slice(-6).toUpperCase()}</div>
                <div className="ap-page-subtitle">{new Date(selectedOrder.orderedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
              </div>
              <button className="ap-icon-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            
            <div className="ap-card-body">
              <div style={{ marginBottom: 24 }}>
                <div className="ap-label" style={{ fontSize: 12, textTransform: 'uppercase', color: '#888' }}>Customer Info</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedOrder.customerName}</div>
                <div style={{ color: '#888', fontSize: 14 }}>{selectedOrder.address}</div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div className="ap-label" style={{ fontSize: 12, textTransform: 'uppercase', color: '#888' }}>Order Items</div>
                {selectedOrder.books?.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>Qty: {b.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{b.price * b.quantity}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 800, fontSize: 18 }}>
                  <span>Total</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div className="ap-label" style={{ fontSize: 12, textTransform: 'uppercase', color: '#888', marginBottom: 16 }}>Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {STATUS_ORDER.map(s => (
                    <button
                      key={s}
                      className={`ap-btn ${selectedOrder.status === s ? 'primary' : 'outline'}`}
                      onClick={() => handleStatusChange(selectedOrder._id, s)}
                      disabled={updating === selectedOrder._id}
                      style={{ fontSize: 12 }}
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
    </AdminLayout>
  );
}
