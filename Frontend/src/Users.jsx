import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API_URL from './config';

// Premium SVG Icons
const Icons = {
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Customer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  ),
  Admin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  ),
  List: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  )
};

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deleting, setDeleting] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [viewOrdersUser, setViewOrdersUser] = useState(null);

  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
    setLoading(true);
    try {
      const [userRes, orderRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const userData = await userRes.json();
      const orderData = await orderRes.json();
      if (userRes.ok) setUsers(userData);

      if (orderRes.ok && orderData.orders) {
        const stats = {};
        orderData.orders.forEach(o => {
          const uid = o.userId?._id || o.userId;
          if (!uid) return;
          if (!stats[uid]) stats[uid] = { orders: 0, total: 0 };
          stats[uid].orders += 1;
          stats[uid].total += o.totalAmount || 0;
        });
        setUserStats(stats);
      }
    } catch { console.error('Error fetching users'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    const token = localStorage.getItem('token');
    setDeleting(user._id);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(prev => prev.filter(u => u._id !== user._id));
    } catch { console.error('Error deleting user'); }
    finally { setDeleting(null); }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesRole = roleFilter === 'All' || (roleFilter === 'Admin' ? u.isAdmin : !u.isAdmin);
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const adminCount = users.filter(u => u.isAdmin).length;
  const customerCount = users.filter(u => !u.isAdmin).length;

  return (
    <AdminLayout
      title="User Accounts"
      subtitle={`${users.length} registered users on the platform`}
      onRefresh={fetchUsers}
    >
      <div className="animate-fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          <div className="ap-stat-card">
            <div className="ap-stat-icon purple"><Icons.Users /></div>
            <div>
              <div className="ap-stat-label">Total Users</div>
              <div className="ap-stat-value">{users.length}</div>
            </div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-icon blue"><Icons.Customer /></div>
            <div>
              <div className="ap-stat-label">Customers</div>
              <div className="ap-stat-value">{customerCount}</div>
            </div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-icon indigo"><Icons.Admin /></div>
            <div>
              <div className="ap-stat-label">Admins</div>
              <div className="ap-stat-value">{adminCount}</div>
            </div>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <div className="ap-card-title">User List</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <select className="ap-select" style={{ width: 140 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                <option value="Customer">Customers</option>
                <option value="Admin">Admins</option>
              </select>
              <input className="ap-search-input" placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Activity</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const isSelf = user._id === currentAdmin._id;
                  const stats = userStats[user._id] || { orders: 0, total: 0 };
                  return (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#71717a' }}>
                            {user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.name} {isSelf && '(You)'}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ap-badge ${user.isAdmin ? 'delivered' : 'pending'}`}>
                          {user.isAdmin ? 'Administrator' : 'Customer'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{stats.orders} orders</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>₹{stats.total.toLocaleString()}</div>
                      </td>
                      <td style={{ fontSize: 13, color: '#888' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="ap-icon-btn" title="View Orders" onClick={() => setViewOrdersUser(user)}>
                            <Icons.List />
                          </button>
                          <button className="ap-icon-btn" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(user)} disabled={isSelf}>
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewOrdersUser && (
        <>
          <div className="ap-drawer-backdrop" onClick={() => setViewOrdersUser(null)} />
          <div className="ap-modal" style={{ maxWidth: 400 }}>
            <div className="ap-card-body" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f4f4f5', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {viewOrdersUser.name[0].toUpperCase()}
              </div>
              <h3 style={{ marginBottom: 4 }}>{viewOrdersUser.name}</h3>
              <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>{viewOrdersUser.email}</p>
              
              <div style={{ background: '#f9f9fb', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>Lifetime Orders</span>
                  <span style={{ fontWeight: 700 }}>{userStats[viewOrdersUser._id]?.orders || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Total Investment</span>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>₹{(userStats[viewOrdersUser._id]?.total || 0).toLocaleString()}</span>
                </div>
              </div>

              <button className="ap-btn primary" style={{ width: '100%' }} onClick={() => setViewOrdersUser(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
