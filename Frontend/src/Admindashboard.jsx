import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import AdminLayout from './AdminLayout';
import API_URL from './config';

const INSIGHT_ICONS = ['📈', '⚠️', '🔥', '💡', '📦', '🎯'];

export default function Admindashboard() {
  const navigate      = useNavigate();
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType,  setChartType]  = useState('revenue');

  // AI Insights state
  const [aiInsights,     setAiInsights]     = useState(null);
  const [aiInsightLines, setAiInsightLines] = useState([]);
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiError,        setAiError]        = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('adminUser') || 'null');
    if (!token || !user?.isAdmin) { navigate('/adminlogin'); return; }
    fetchStats();
  }, []);

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
        // Parse bullet lines from the response
        const lines = data.insights
          .split('\n')
          .map(l => l.replace(/^[\*\-•]\s*/, '').trim())
          .filter(l => l.length > 10)
          .slice(0, 5);
        setAiInsightLines(lines);
        setAiInsights(data.insights);
      } else {
        setAiError(data.error || 'AI service unavailable. Try again.');
      }
    } catch {
      setAiError('Could not reach server. Check your connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const STAT_CARDS = stats ? [
    { label: 'Total Revenue',    value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', cls: 'green',  sub: 'All time'                             },
    { label: 'Total Orders',     value: stats.totalOrders,    icon: '📦', cls: 'blue',   sub: `${stats.pendingOrders} pending`             },
    { label: 'Registered Users', value: stats.totalUsers,     icon: '👥', cls: 'purple', sub: 'Customers'                                  },
    { label: 'Total Books',      value: stats.totalBooks,     icon: '📚', cls: 'indigo', sub: `${stats.outOfStock} out of stock`            },
    { label: 'Low Stock Alert',  value: stats.lowStockBooks,  icon: '⚠️', cls: 'amber',  sub: '≤ 5 copies left'                            },
    { label: 'Out of Stock',     value: stats.outOfStock,     icon: '❌', cls: 'red',    sub: 'Need restocking'                            },
  ] : [];

  const QUICK_ACTIONS = [
    { icon: '📦', label: 'Manage Orders', path: '/admin/orders', desc: 'Update statuses' },
    { icon: '📚', label: 'Inventory',     path: '/manage-books', desc: 'Edit stock & books' },
    { icon: '➕', label: 'Add Book',      path: '/add-book',     desc: 'List a new title'  },
    { icon: '👥', label: 'Users',         path: '/users',        desc: 'Manage customers'  },
  ];

  const customTooltipStyle = {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
  };

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Real-time overview of your store"
      onRefresh={() => fetchStats(true)}
      refreshing={refreshing}
    >
      {loading ? (
        /* Skeleton loaders */
        <>
          <div className="ap-skel-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="ap-skel-card" />)}
          </div>
          <div className="ap-skel-card" style={{ height: 320, borderRadius: 18, marginBottom: 20 }} />
        </>
      ) : stats ? (
        <>
          {/* Low stock alert */}
          {stats.lowStockBooks > 0 && (
            <div className="ap-alert-strip">
              ⚠️ {stats.lowStockBooks} book{stats.lowStockBooks > 1 ? 's are' : ' is'} running low on stock.
              <button
                className="ap-btn subtle"
                style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 12 }}
                onClick={() => navigate('/manage-books')}
              >View Inventory →</button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="ap-stats-grid">
            {STAT_CARDS.map(c => (
              <div className={`ap-stat-card ${c.cls}`} key={c.label}>
                <div className={`ap-stat-icon ${c.cls}`}>{c.icon}</div>
                <div>
                  <div className="ap-stat-label">{c.label}</div>
                  <div className="ap-stat-value">{c.value}</div>
                  <div className="ap-stat-sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="ap-card">
            <div className="ap-card-header">
              <span className="ap-card-title">📈 Last 7 Days Performance</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`ap-btn ${chartType === 'revenue' ? 'primary' : 'subtle'}`} onClick={() => setChartType('revenue')}>Revenue</button>
                <button className={`ap-btn ${chartType === 'orders'  ? 'primary' : 'subtle'}`} onClick={() => setChartType('orders')}>Orders</button>
              </div>
            </div>
            <div className="ap-chart-wrap" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'revenue' ? (
                  <AreaChart data={stats.salesChart}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis dataKey="date"    stroke="#9ca3af" fontSize={12} />
                    <YAxis                   stroke="#9ca3af" fontSize={12} />
                    <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                  </AreaChart>
                ) : (
                  <LineChart data={stats.salesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis dataKey="date"     stroke="#9ca3af" fontSize={12} />
                    <YAxis                    stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={customTooltipStyle} />
                    <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">⚡ Quick Actions</span></div>
            <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {QUICK_ACTIONS.map(a => (
                <div
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  style={{
                    background: '#f9fafb', borderRadius: 14, padding: '18px 16px',
                    cursor: 'pointer', border: '1.5px solid #eef0f6',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f0efff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor = '#eef0f6'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{a.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Business Insights */}
          <div className="ap-ai-card">
            <div className="ap-ai-header">
              <div className="ap-ai-title">
                ✨ AI Business Insights
                <span className="ap-ai-badge">Gemini 2.5</span>
              </div>
              <button
                className="ap-btn ai"
                onClick={generateAiInsights}
                disabled={aiLoading}
                style={{ fontSize: 12 }}
              >
                {aiLoading ? (
                  <><div className="ap-spinner" style={{ width: 14, height: 14, borderWidth: 2, margin: 0 }} /> Analysing…</>
                ) : (
                  '✨ Generate Insights'
                )}
              </button>
            </div>
            <div className="ap-ai-body">
              {aiError && (
                <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                  {aiError}
                </div>
              )}
              {!aiInsightLines.length && !aiLoading && !aiError && (
                <div className="ap-ai-empty">
                  Click "Generate Insights" to get AI-powered analysis of your store's performance and inventory.
                </div>
              )}
              {aiInsightLines.map((line, i) => (
                <div key={i} className="ap-insight-item" style={{ animationDelay: `${i * 0.07}s` }}>
                  <span className="ap-insight-icon">{INSIGHT_ICONS[i % INSIGHT_ICONS.length]}</span>
                  <span className="ap-insight-text">{line}</span>
                </div>
              ))}
            </div>
          </div>

        </>
      ) : (
        <div className="ap-empty">
          <div className="ap-empty-icon">⚠️</div>
          <h3>Could not load stats</h3>
          <p>Check your connection and refresh.</p>
        </div>
      )}
    </AdminLayout>
  );
}