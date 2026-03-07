import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from './AdminLayout';
import API_URL from './config';

// Premium SVG Icons for Dashboard
const Icons = {
  Revenue: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/><path d="m5 7 3 5-3 5"/><path d="m19 7-3 5 3 5"/></svg>
  ),
  Orders: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Users: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Books: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
  ),
  Alert: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  Add: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  )
};

export default function Admindashboard() {
  const navigate      = useNavigate();
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType,  setChartType]  = useState('revenue');

  // AI Insights state
  const [aiInsightLines, setAiInsightLines] = useState([]);
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiError,        setAiError]        = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('adminUser') || 'null');
    if (!token || !user?.isAdmin) { navigate('/adminlogin'); return; }
    fetchStats();
  }, [navigate]);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) { console.error('Stats error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const generateAiInsights = async () => {
    setAiLoading(true);
    setAiError('');
    setAiInsightLines([]);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API_URL}/api/ai-insights`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.insights) {
        const lines = data.insights.split('\n').map(l => l.replace(/^[\*\-•]\s*/, '').trim()).filter(l => l.length > 5).slice(0, 4);
        setAiInsightLines(lines);
      } else setAiError(data.error || 'AI service unavailable.');
    } catch { setAiError('Could not reach server.'); }
    finally { setAiLoading(false); }
  };

  const STATS = stats ? [
    { label: 'Revenue',    value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <Icons.Revenue />, sub: 'All time', cls: 'up' },
    { label: 'Orders',     value: stats.totalOrders,    icon: <Icons.Orders />,  sub: `${stats.pendingOrders} pending`, cls: 'up' },
    { label: 'Users',      value: stats.totalUsers,     icon: <Icons.Users />,   sub: 'Customers', cls: 'up' },
    { label: 'Inventory',  value: stats.totalBooks,     icon: <Icons.Books />,   sub: `${stats.outOfStock} out of stock`, cls: 'down' },
  ] : [];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Overview of your store performance"
      onRefresh={() => fetchStats(true)}
      refreshing={refreshing}
    >
      {loading ? (
        <div className="ap-skel-grid">
          {[1,2,3,4].map(i => <div key={i} className="ap-skel-card" />)}
        </div>
      ) : stats ? (
        <div className="animate-fade-in">
          {/* Stats Grid */}
          <div className="ap-stats-grid">
            {STATS.map(s => (
              <div key={s.label} className="ap-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="ap-stat-label">{s.label}</div>
                  <div style={{ color: '#000' }}>{s.icon}</div>
                </div>
                <div className="ap-stat-value">{s.value}</div>
                <div className={`ap-stat-sub ${s.cls}`}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* Chart Container */}
            <div className="ap-card">
              <div className="ap-card-header">
                <div className="ap-card-title">Analytics</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`ap-btn ${chartType === 'revenue' ? 'primary' : 'outline'}`} style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setChartType('revenue')}>Revenue</button>
                  <button className={`ap-btn ${chartType === 'orders' ? 'primary' : 'outline'}`} style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setChartType('orders')}>Orders</button>
                </div>
              </div>
              <div className="ap-card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesChart}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                      itemStyle={{ fontSize: 12, fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey={chartType} stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions / Activity */}
            <div className="ap-card">
              <div className="ap-card-header"><div className="ap-card-title">Quick Actions</div></div>
              <div className="ap-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="ap-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/add-book')}><Icons.Add /> Add New Book</button>
                <button className="ap-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/admin/orders')}><Icons.Orders /> Manage Orders</button>
                <button className="ap-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/manage-books')}><Icons.Inventory /> Check Inventory</button>
                <button className="ap-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/users')}><Icons.Users /> Customer List</button>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="ap-card" style={{ border: '1px solid #000', background: '#000', color: '#fff' }}>
            <div className="ap-card-header" style={{ borderBottomColor: '#333' }}>
              <div className="ap-card-title" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                ✨ Smart Analysis
                <span style={{ fontSize: 10, padding: '2px 6px', background: '#333', borderRadius: 4 }}>Gemini Engine</span>
              </div>
              <button className="ap-btn outline" style={{ background: '#fff', color: '#000', fontSize: 12, padding: '4px 12px' }} onClick={generateAiInsights} disabled={aiLoading}>
                {aiLoading ? 'Analysing...' : 'Generate Insights'}
              </button>
            </div>
            <div className="ap-card-body">
              {aiError && <div style={{ color: '#ff8a8a', fontSize: 13 }}>{aiError}</div>}
              {!aiInsightLines.length && !aiLoading && <div style={{ color: '#888', fontSize: 13 }}>Click to get AI-powered store optimization tips.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiInsightLines.map((line, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0070f3' }} />
                    <div style={{ fontSize: 14 }}>{line}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ap-empty"><h3>Data unavailable</h3></div>
      )}
    </AdminLayout>
  );
}
