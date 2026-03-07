import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API_URL from './config';

export default function Users() {
  const navigate   = useNavigate();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [search,   setSearch]   = useState('');
  const [roleFilter,setRoleFilter] = useState('All');
  const [toast,    setToast]    = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [userStats, setUserStats] = useState({}); // { userId: { orders, total } }
  const [viewOrdersUser, setViewOrdersUser] = useState(null); // { user, orders }

  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async (isRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [userRes, orderRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`,  { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const userData  = await userRes.json();
      const orderData = await orderRes.json();
      if (userRes.ok) setUsers(userData);
      else if (userRes.status === 401 || userRes.status === 403) { navigate('/adminlogin'); return; }
      else showToast('Failed to load users', 'error');

      // Compute per-user stats from orders
      if (orderRes.ok && orderData.orders) {
        const stats = {};
        for (const o of orderData.orders) {
          const uid = o.userId?.toString() || o.userId;
          if (!uid) continue;
          if (!stats[uid]) stats[uid] = { orders: 0, total: 0 };
          stats[uid].orders += 1;
          stats[uid].total  += o.totalAmount || 0;
        }
        setUserStats(stats);
      }
    } catch { showToast('Network error', 'error'); }
    finally { setLoading(false); setRefreshing(false); };
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the platform? This will also clear their cart. This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    setDeleting(id);
    try {
      const res  = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
        showToast(`✅ ${data.message}`, 'success');
      } else { showToast(data.error || 'Failed to delete user', 'error'); }
    } catch { showToast('Network error', 'error'); }
    finally { setDeleting(null); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    let result = [...users];
    if (roleFilter === 'Admin')    result = result.filter(u => u.isAdmin);
    if (roleFilter === 'Customer') result = result.filter(u => !u.isAdmin);
    if (search.trim()) result = result.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [users, roleFilter, search]);

  const adminCount    = users.filter(u => u.isAdmin).length;
  const customerCount = users.filter(u => !u.isAdmin).length;

  return (
    <AdminLayout
      title="User Management"
      subtitle={`${users.length} total accounts · ${customerCount} customers · ${adminCount} admins`}
      onRefresh={() => fetchUsers(true)}
      refreshing={refreshing}
    >
      {/* Mini stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="ap-stat-card" style={{ flex: '1 1 160px', cursor: 'pointer' }} onClick={() => setRoleFilter('All')}>
          <div className="ap-stat-icon purple">👥</div>
          <div><div className="ap-stat-label">Total Accounts</div><div className="ap-stat-value">{users.length}</div></div>
        </div>
        <div className="ap-stat-card" style={{ flex: '1 1 160px', cursor: 'pointer' }} onClick={() => setRoleFilter('Customer')}>
          <div className="ap-stat-icon blue">🛒</div>
          <div><div className="ap-stat-label">Customers</div><div className="ap-stat-value">{customerCount}</div></div>
        </div>
        <div className="ap-stat-card" style={{ flex: '1 1 160px', cursor: 'pointer' }} onClick={() => setRoleFilter('Admin')}>
          <div className="ap-stat-icon indigo">👑</div>
          <div><div className="ap-stat-label">Admins</div><div className="ap-stat-value">{adminCount}</div></div>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <span className="ap-card-title">
            {roleFilter !== 'All' ? `${roleFilter}s` : 'All Users'}
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>{filtered.length} shown</span>
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              {['All', 'Customer', 'Admin'].map(r => (
                <button
                  key={r}
                  style={{ padding: '7px 14px', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                    background: roleFilter === r ? '#6366f1' : '#fff',
                    color:      roleFilter === r ? '#fff'    : '#6b7280'
                  }}
                  onClick={() => setRoleFilter(r)}
                >{r}</button>
              ))}
            </div>
            <input
              className="ap-search-input"
              placeholder="🔍 Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="ap-loading"><div className="ap-spinner"/><p>Loading users…</p></div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty"><div className="ap-empty-icon">🔍</div><h3>No users found</h3><p>Try a different search or filter.</p></div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(user => {
                  const isSelf = user._id === currentAdmin._id;
                  return (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="ap-avatar" style={{ background: user.isAdmin ? '#ede9fe' : '#eff6ff', color: user.isAdmin ? '#6d28d9' : '#2563eb' }}>
                            {user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14 }}>{user.name}</div>
                            {isSelf && <div style={{ fontSize: 11, color: '#9ca3af' }}>You (current admin)</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#6b7280', fontSize: 13 }}>{user.email}</td>
                      <td>
                        <span className={`ap-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                          {user.isAdmin ? '👑 Admin' : 'Customer'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                        {userStats[user._id]?.orders ?? '—'}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>
                        {userStats[user._id] ? `₹${userStats[user._id].total.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ fontSize: 12.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="ap-btn subtle"
                            style={{ fontSize: 12 }}
                            onClick={() => setViewOrdersUser(user)}
                          >📋 Orders</button>
                          <button
                            className="ap-btn danger"
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={isSelf || deleting === user._id}
                            title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                          >
                            {deleting === user._id ? '…' : isSelf ? '🔒' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div className={`ap-toast ${toast.type}`}>{toast.msg}</div>}

      {/* ─── View Orders Modal ─── */}
      {viewOrdersUser && (
        <div className="ap-confirm-backdrop" onClick={() => setViewOrdersUser(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, padding: '28px', width: 460, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, color: '#0f0c29' }}>📋 {viewOrdersUser.name}'s Orders</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {userStats[viewOrdersUser._id]?.orders ?? 0} orders · ₹{(userStats[viewOrdersUser._id]?.total || 0).toLocaleString('en-IN')} total
                </div>
              </div>
              <button className="ap-drawer-close" onClick={() => setViewOrdersUser(null)}>✕</button>
            </div>
            {!userStats[viewOrdersUser._id] ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No orders found for this user.</p>
            ) : (
              <p style={{ color: '#6b7280', fontSize: 13 }}>This user has placed {userStats[viewOrdersUser._id].orders} order(s) worth ₹{userStats[viewOrdersUser._id].total.toLocaleString('en-IN')} in total.</p>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}