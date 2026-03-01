import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import API_URL from './config';

export default function Admindashboard() {
  const navigate    = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [chartType, setChartType] = useState('revenue'); 
  const [dateRange, setDateRange] = useState('7ays'); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('adminUser') || 'null');
    if (!token || !user?.isAdmin) { navigate('/adminlogin'); return; }
    fetchStats();
  }, [dateRange]);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const token = localStorage.getItem('token');
    
    let query = '';
    const now = new Date();
    if (dateRange === 'today') {
      query = `?startDate=${startOfDay(now).toISOString()}&endDate=${endOfDay(now).toISOString()}`;
    } else if (dateRange === '7days') {
      query = `?startDate=${subDays(now, 7).toISOString()}&endDate=${endOfDay(now).toISOString()}`;
    } else if (dateRange === '30days') {
      query = `?startDate=${subDays(now, 30).toISOString()}&endDate=${endOfDay(now).toISOString()}`;
    }

    try {
      const res  = await fetch(`${API_URL}/api/admin/stats${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        if (isRefresh) toast.success('Dashboard updated');
      } else {
        toast.error('Failed to load stats');
      }
    } catch (err) { 
        console.error('Stats error:', err); 
        toast.error('Network error loading stats');
    } finally { 
        setLoading(false); 
        setRefreshing(false); 
    }
  }, [dateRange]);

  const STAT_CARDS = stats ? [
    { label: 'Total Revenue',   value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', cls: 'green',  sub: 'For selected period' },
    { label: 'Total Orders',    value: stats.totalOrders,    icon: '📦', cls: 'blue',   sub: `${stats.pendingOrders} pending` },
    { label: 'Average Order',   value: `₹${stats.avgOrderValue}`, icon: '📈', cls: 'purple', sub: 'Revenue / Orders' },
    { label: 'Best Seller',     value: stats.topSellingBook, icon: '🌟', cls: 'amber',  sub: 'Top product' },
    { label: 'Low Stock Alert', value: stats.lowStockBooks,  icon: '⚠️', cls: 'amber',  sub: '≤ 5 copies left' },
    { label: 'Out of Stock',    value: stats.outOfStock,     icon: '❌', cls: 'red',    sub: 'Need restocking' },
    { label: 'Registered Users',value: stats.totalUsers,     icon: '👥', cls: 'purple', sub: 'Total Customers' },
    { label: 'Cancelled Orders',value: stats.cancelledOrders,icon: '🗑️', cls: 'red',    sub: 'Lost revenue' },
  ] : [];

  const QUICK_ACTIONS = [
    { icon: '📦', label: 'Manage Orders', path: '/admin/orders', desc: 'Update statuses' },
    { icon: '📚', label: 'Inventory',     path: '/manage-books', desc: 'Edit stock & books' },
    { icon: '➕', label: 'Add Book',      path: '/add-book',     desc: 'List a new title' },
    { icon: '👥', label: 'Users',         path: '/users',        desc: 'Manage customers' },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Real-time overview of your store"
      onRefresh={() => fetchStats(true)}
      refreshing={refreshing}
    >
      {loading ? (
        <div className="ap-loading"><div className="ap-spinner"/><p>Loading real-time data…</p></div>
      ) : stats ? (
        <>
          {/* Filters */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <select className="ap-status-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Low stock alert */}
          {stats.lowStockBooks > 0 && (
            <div className="ap-alert-strip">
              ⚠️ {stats.lowStockBooks} book{stats.lowStockBooks > 1 ? 's are' : ' is'} running low on stock.
              <button className="ap-btn subtle" style={{ marginLeft: 'auto', padding: '6px 14px' }} onClick={() => navigate('/manage-books')}>
                View Inventory →
              </button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="ap-stats-grid">
            {STAT_CARDS.map(c => (
              <div className="ap-stat-card" key={c.label}>
                <div className={`ap-stat-icon ${c.cls}`}>{c.icon}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="ap-stat-label">{c.label}</div>
                  <div className="ap-stat-value" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.value}</div>
                  <div className="ap-stat-sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="ap-card" style={{ marginBottom: 20 }}>
            <div className="ap-card-header">
              <span className="ap-card-title">📈 Performance Chart</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`ap-btn ${chartType === 'revenue' ? 'primary' : 'subtle'}`} onClick={() => setChartType('revenue')}>Revenue</button>
                <button className={`ap-btn ${chartType === 'orders'  ? 'primary' : 'subtle'}`} onClick={() => setChartType('orders')}>Orders</button>
              </div>
            </div>
            <div className="ap-chart-wrap" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'revenue' ? (
                  <BarChart data={stats.salesChart} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      formatter={(v) => [`₹${v}`, 'Revenue']}
                      contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={stats.salesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      formatter={(v) => [v, 'Orders']}
                      contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">⚡ Quick Actions</span></div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {QUICK_ACTIONS.map(a => (
                <div
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  style={{
                    background: 'var(--card-bg, #f9fafb)', borderRadius: 14, padding: '20px 18px',
                    cursor: 'pointer', border: '1.5px solid var(--border-color, #eef0f6)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border-color, #eef0f6)'; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b', marginBottom: 3 }} className="ap-action-label">{a.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="ap-empty"><div className="ap-empty-icon">⚠️</div><h3>Could not load stats</h3><p>Check your connection and refresh.</p></div>
      )}
    </AdminLayout>
  );
}