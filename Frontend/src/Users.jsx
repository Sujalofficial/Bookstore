import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import API_URL from './config';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [processingId, setProcessingId] = useState(null);

  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => { 
      const delay = setTimeout(() => {
          fetchUsers(); 
      }, 500);
      return () => clearTimeout(delay);
  }, [page, search, roleFilter]);

  const fetchUsers = async (isRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users?page=${page}&limit=10&search=${search}&role=${roleFilter}`, { 
          headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (res.ok) { 
          setUsers(data.users || []); 
          setTotalPages(data.pages || 1);
          setTotalUsers(data.total || 0);
          if(isRefresh) toast.success('Users refreshed');
      } else if (res.status === 401 || res.status === 403) navigate('/adminlogin');
    } catch { toast.error('Network error fetching users'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleAction = async (id, actionStr, apiMethod, endpoint, body = null, confirmMsg = null) => {
      if(confirmMsg && !window.confirm(confirmMsg)) return;
      const token = localStorage.getItem('token');
      setProcessingId(`${id}-${actionStr}`);
      try {
          const reqOpt = { method: apiMethod, headers: { Authorization: `Bearer ${token}` } };
          if (body) {
              reqOpt.headers['Content-Type'] = 'application/json';
              reqOpt.body = JSON.stringify(body);
          }
          const res = await fetch(`${API_URL}/api/admin/users/${id}${endpoint}`, reqOpt);
          const data = await res.json();
          if(res.ok) {
              if (actionStr === 'delete') {
                  setUsers(prev => prev.filter(u => u._id !== id));
                  setTotalUsers(prev => prev - 1);
              } else {
                  setUsers(prev => prev.map(u => u._id === id ? { ...u, ...body } : u));
              }
              toast.success(data.message || 'Success');
          } else {
              toast.error(data.error || 'Action failed');
          }
      } catch (err) { toast.error('Server error'); }
      finally { setProcessingId(null); }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle={`${totalUsers} total registered accounts`}
      onRefresh={() => fetchUsers(true)}
      refreshing={refreshing}
    >
      <div className="ap-card">
        <div className="ap-card-header" style={{ flexWrap: 'wrap' }}>
          <span className="ap-card-title">Accounts List</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">Customer</option>
            </select>
            <input
              className="ap-search-input"
              placeholder="🔍 Search name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="ap-loading"><div className="ap-spinner"/><p>Loading users…</p></div>
        ) : users.length === 0 ? (
          <div className="ap-empty"><div className="ap-empty-icon">🔍</div><h3>No users found</h3><p>Try a different search or filter.</p></div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr>
                <th>User Details</th>
                <th>Role & Status</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(user => {
                  const isSelf = user._id === currentAdmin._id;
                  const isBlocking = processingId === `${user._id}-block`;
                  const isRoleChanging = processingId === `${user._id}-role`;
                  return (
                    <tr key={user._id} style={{ opacity: user.isBlocked ? 0.6 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="ap-avatar" style={{ background: user.isAdmin ? '#ede9fe' : '#eff6ff', color: user.isAdmin ? '#6d28d9' : '#2563eb' }}>
                            {user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14 }}>{user.name}</div>
                            <div style={{ color: '#6b7280', fontSize: 12 }}>{user.email} {isSelf && '(You)'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className={`ap-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                            {user.isAdmin ? '👑 Admin' : 'Customer'}
                            </span>
                            {user.isBlocked && <span className="ap-badge cancelled" style={{ fontSize: 10 }}>Blocked</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{user.ordersCount || 0}</td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>₹{user.totalSpent || 0}</td>
                      <td style={{ fontSize: 12.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className={`ap-btn subtle`}
                              style={{ padding: '6px 12px', fontSize: 11 }}
                              disabled={isSelf || isBlocking}
                              onClick={() => handleAction(user._id, 'block', 'PUT', '/block', { isBlocked: !user.isBlocked })}
                            >
                              {user.isBlocked ? '🔓 Unblock' : '🚫 Block'}
                            </button>
                            
                            <button
                              className={`ap-btn subtle`}
                              style={{ padding: '6px 12px', fontSize: 11 }}
                              disabled={isSelf || isRoleChanging}
                              onClick={() => handleAction(user._id, 'role', 'PUT', '/role', { isAdmin: !user.isAdmin }, `Make ${user.name} an ${!user.isAdmin ? 'Admin' : 'Customer'}?`)}
                            >
                              {user.isAdmin ? 'Demote' : 'Promote'}
                            </button>

                            <button
                              className="ap-btn danger"
                              style={{ padding: '6px 12px', fontSize: 11 }}
                              disabled={isSelf || processingId === `${user._id}-delete`}
                              onClick={() => handleAction(user._id, 'delete', 'DELETE', '', null, `Delete ${user.name}? Cannot be undone.`)}
                            >
                              Delete
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

        {/* Pagination */ }
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: 13, color: '#6b7280'}}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="ap-btn subtle" disabled={page <= 1} onClick={() => setPage(page-1)}>Prev</button>
                <button className="ap-btn subtle" disabled={page >= totalPages} onClick={() => setPage(page+1)}>Next</button>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
}