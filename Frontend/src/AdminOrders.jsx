import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import API_URL from './config';

const STATUS_ORDER = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updating, setUpdating] = useState(null); 
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // detail modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => { 
    const debounce = setTimeout(() => {
        fetchOrders(); 
    }, 500);
    return () => clearTimeout(debounce);
  }, [page, search, statusFilter]);

  const fetchOrders = async (isRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders?page=${page}&limit=10&search=${search}&status=${statusFilter}`, { 
          headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (res.ok) { 
          setOrders(data.orders || []); 
          setTotalPages(data.pages || 1);
          setTotalOrders(data.total || 0);
          if (isRefresh) toast.success('Orders refreshed');
      } else if (res.status === 401 || res.status === 403) navigate('/adminlogin');
    } catch (err) { toast.error('Network error fetching orders'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleStatusChange = async (id, newStatus, newPaymentStatus = null) => {
    const token = localStorage.getItem('token');
    setUpdating(id);
    try {
      const bodyPayload = { status: newStatus };
      if (newPaymentStatus) bodyPayload.paymentStatus = newPaymentStatus;

      const res = await fetch(`${API_URL}/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus, paymentStatus: newPaymentStatus || o.paymentStatus } : o));
        toast.success(`Order updated`);
      } else {
        toast.error('Failed to update status');
      }
    } catch { toast.error('Network error'); }
    finally { setUpdating(null); }
  };

  const handleBulkUpdate = async () => {
    if(!bulkStatus || selectedOrders.length === 0) return toast.error('Select orders and a status');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/bulk`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderIds: selectedOrders, status: bulkStatus }),
      });
      if(res.ok) {
          toast.success(`Bulk updated ${selectedOrders.length} orders`);
          setSelectedOrders([]);
          setBulkStatus('');
          fetchOrders();
      } else {
          toast.error('Bulk update failed');
      }
    } catch { toast.error('Network error'); }
  };

  const toggleOrderSelection = (id) => {
      setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
      if(selectedOrders.length === orders.length) setSelectedOrders([]);
      else setSelectedOrders(orders.map(o => o._id));
  };

  const exportCSV = () => {
    const header = ['Order ID', 'Customer', 'Books', 'Total Amount', 'Status', 'Payment Status', 'Order Date', 'Address'];
    const rows = orders.map(o => [
      o._id, o.customerName, o.books.map(b => `${b.title} (x${b.quantity})`).join('|'),
      o.totalAmount, o.status, o.paymentStatus || 'Paid', new Date(o.orderedAt).toLocaleString(), o.address
    ]);
    const csvContent = [header, ...rows].map(e => e.map(i => `"${String(i).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV Exported');
  };

  return (
    <AdminLayout
      title="Order Management"
      subtitle={`${totalOrders} total orders`}
      onRefresh={() => fetchOrders(true)}
      refreshing={refreshing}
    >

      {/* Table card */}
      <div className="ap-card">
        <div className="ap-card-header" style={{ flexWrap: 'wrap' }}>
          <span className="ap-card-title" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>Orders List</span>
            <button className="ap-btn primary" onClick={exportCSV} style={{ padding: '6px 12px', fontSize: 12 }}>📥 Export CSV</button>
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedOrders.length > 0 && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#f3f4f6', padding: '4px 8px', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>{selectedOrders.length} selected</span>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ padding: '4px', borderRadius: 4, outline: 'none' }}>
                        <option value="">Status...</option>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="ap-btn primary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={handleBulkUpdate}>Apply</button>
                </div>
            )}
            <select
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="ap-search-input"
              placeholder="🔍 Search ID / Name"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="ap-loading"><div className="ap-spinner"/><p>Loading orders…</p></div>
        ) : orders.length === 0 ? (
          <div className="ap-empty"><div className="ap-empty-icon">📭</div><h3>No orders found</h3><p>Try changing your filters.</p></div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr>
                <th><input type="checkbox" onChange={selectAll} checked={selectedOrders.length === orders.length && orders.length > 0} /></th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Books</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr></thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td><input type="checkbox" checked={selectedOrders.includes(order._id)} onChange={() => toggleOrderSelection(order._id)} /></td>
                    <td>
                        <span style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace', cursor: 'pointer' }} onClick={() => setSelectedOrderDetails(order)}>
                            #{order._id.slice(-6).toUpperCase()}
                        </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="ap-avatar">{(order.customerName || 'U')[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{order.customerName || '—'}</span>
                      </div>
                    </td>
                    <td>
                       <span style={{ fontSize: 12, color: '#6b7280' }}>{order.books.length} items</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>₹{order.totalAmount}</td>
                    <td>
                       <span className={`ap-badge ${order.paymentStatus === 'Refunded' ? 'cancelled' : order.paymentStatus === 'Unpaid' ? 'pending' : 'delivered'}`}>{order.paymentStatus || 'Paid'}</span>
                    </td>
                    <td>
                      <select
                        className={`ap-status-select ${order.status?.toLowerCase()}`}
                        value={order.status || 'Pending'}
                        onChange={e => handleStatusChange(order._id, e.target.value, order.paymentStatus)}
                        disabled={updating === order._id}
                      >
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                        <button className="ap-btn subtle" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setSelectedOrderDetails(order)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */ }
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: 13, color: '#6b7280'}}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="ap-btn subtle" disabled={page <= 1} onClick={() => setPage(page-1)}>Prev</button>
                <button className="ap-btn subtle" disabled={page >= totalPages} onClick={() => setPage(page+1)}>Next</button>
            </div>
        </div>
      </div>

      {/* Order details modal */}
      {selectedOrderDetails && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div style={{ background: 'var(--card-bg, #fff)', width: '90%', maxWidth: 600, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main, #111)' }}>Order Details #{selectedOrderDetails._id.slice(-6).toUpperCase()}</h3>
                      <button onClick={() => setSelectedOrderDetails(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✖</button>
                  </div>
                  <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto', color: 'var(--text-main, #111)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                          <div>
                              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>Customer</p>
                              <strong>{selectedOrderDetails.customerName}</strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>Order Date</p>
                              <strong>{new Date(selectedOrderDetails.orderedAt).toLocaleString('en-IN')}</strong>
                          </div>
                      </div>
                      <div style={{ marginBottom: 24 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>Delivery Address</p>
                          <div style={{ background: 'var(--bg-subtle, #f9fafb)', padding: 12, borderRadius: 8, fontSize: 14 }}>{selectedOrderDetails.address}</div>
                      </div>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Purchased Items</p>
                      <div style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 8 }}>
                          {selectedOrderDetails.books.map((b, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: i < selectedOrderDetails.books.length - 1 ? '1px solid var(--border-color, #e5e7eb)' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      {b.image ? <img src={b.image.startsWith('http') ? b.image : `${API_URL}${b.image}`} alt={b.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}/> : <div style={{width: 40, height: 40, background: '#e5e7eb', borderRadius: 6}}></div>}
                                      <div>
                                          <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                                          <div style={{ fontSize: 12, color: '#6b7280' }}>Qty: {b.quantity}</div>
                                      </div>
                                  </div>
                                  <div style={{ fontWeight: 700 }}>₹{b.price * b.quantity}</div>
                              </div>
                          ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '2px dashed var(--border-color, #e5e7eb)'}}>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>Total Amount</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>₹{selectedOrderDetails.totalAmount}</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </AdminLayout>
  );
}