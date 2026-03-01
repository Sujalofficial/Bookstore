import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API_URL from './config';

const STATUS_ORDER = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const navigate     = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast,      setToast]      = useState(null);
  const [updating,   setUpdating]   = useState(null); // order id being updated

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
          { label: 'Pending',   val: statusCounts.Pending,   cls: 'amber'  },
          { label: 'Shipped',   val: statusCounts.Shipped,   cls: 'blue'   },
          { label: 'Delivered', val: statusCounts.Delivered, cls: 'green'  },
          { label: 'Cancelled', val: statusCounts.Cancelled, cls: 'red'    },
        ].map(s => (
          <div key={s.label} className="ap-stat-card" style={{ flex: '1 1 130px', padding: '14px 16px', cursor: 'pointer' }}
            onClick={() => setStatusFilter(statusFilter === s.label ? 'All' : s.label)}>
            <div className={`ap-stat-icon ${s.cls}`} style={{ width: 34, height: 34 }}>
              {s.label === 'Pending' ? '🕒' : s.label === 'Shipped' ? '🚚' : s.label === 'Delivered' ? '✅' : '❌'}
            </div>
            <div>
              <div className="ap-stat-label">{s.label}</div>
              <div className="ap-stat-value" style={{ fontSize: 20 }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="ap-card">
        <div className="ap-card-header">
          <span className="ap-card-title">
            {statusFilter !== 'All' ? `${statusFilter} Orders` : 'All Orders'}
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>{filtered.length} shown</span>
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }}
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
                  <tr key={order._id}>
                    <td><span style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="ap-avatar">{(order.customerName || 'U')[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{order.customerName || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {order.books.map((b, i) => (
                          <div key={i} style={{ fontSize: 12.5, color: '#374151' }}>
                            📘 {b.title} <span style={{ color: '#9ca3af' }}>×{b.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>₹{order.totalAmount}</td>
                    <td style={{ maxWidth: 160, fontSize: 12, color: '#6b7280' }}>{order.address || '—'}</td>
                    <td style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(order.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
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

      {toast && <div className={`ap-toast ${toast.type}`}>{toast.msg}</div>}
    </AdminLayout>
  );
}