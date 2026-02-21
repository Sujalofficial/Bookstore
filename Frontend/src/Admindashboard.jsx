import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./Admindashboard.css";

export default function Admindashboard() {
  const [adminName, setAdminName] = useState("Admin");
  
  // 🔥 STEP 1: FAKE STATS (Yahan man-chaha number likh do)
  const [stats, setStats] = useState({
    totalUsers: 124,       // Demo Users
    totalOrders: 48,       // Demo Orders
    totalRevenue: 45230    // Demo Revenue (₹)
  });

  // 🔥 STEP 2: FAKE GRAPH DATA (Ye hamesha dikhega)
  const demoGraphData = [
    { name: '15 Feb', sales: 4000 },
    { name: '16 Feb', sales: 3000 },
    { name: '17 Feb', sales: 2000 },
    { name: '18 Feb', sales: 2780 },
    { name: '19 Feb', sales: 1890 },
    { name: '20 Feb', sales: 2390 },
    { name: '21 Feb', sales: 3490 },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('token');
    
    if (!token || !storedUser) {
      navigate('/adminlogin'); 
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.isAdmin) {
      navigate('/'); 
      return;
    }
    
    setAdminName(user.name);
    
    // API call karenge bas token check karne ke liye, par data update nahi karenge
    // taaki tumhara Fake Data hi dikhe.
    // fetchDashboardStats(token); 

  }, [navigate]);

  const handleLogout = () => {
    if(window.confirm("Logout from Dashboard?")) {
      localStorage.clear();
      navigate('/adminlogin');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>👋 Welcome, {adminName}</h1>
          <p>Here is what's happening in your store today.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn-top">Logout 🚪</button>
      </header>

      {/* --- STATS CARDS (AB DEMO NUMBERS DIKHAYENGE) --- */}
      <div className="stats-grid">
        
        {/* Revenue Card */}
        <div className="stat-card revenue">
          <div className="icon">💰</div>
          <div>
            <h3>Total Revenue</h3>
            {/* .toLocaleString() number ko comma (45,230) ke saath dikhata hai */}
            <span className="number">₹{stats.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="stat-card orders">
          <div className="icon">📦</div>
          <div>
            <h3>Total Orders</h3>
            <span className="number">{stats.totalOrders}</span>
          </div>
        </div>

        {/* Users Card */}
        <div className="stat-card users">
          <div className="icon">👥</div>
          <div>
            <h3>Active Users</h3>
            <span className="number">{stats.totalUsers}</span>
          </div>
        </div>
      </div>

      {/* --- GRAPH SECTION --- */}
      <div className="chart-section">
        <h2 className="section-title">📊 Weekly Sales Performance</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoGraphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="sales" fill="#4CAF50" barSize={50} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- QUICK ACTIONS --- */}
      <h2 className="section-title">⚡ Quick Actions</h2>
      <div className="actions-grid">
        <div className="action-card" onClick={() => navigate("/admin/orders")}>
           <div className="action-icon">📦</div>
           <h3>Manage Orders</h3>
        </div>
        <div className="action-card" onClick={() => navigate("/add-book")}>
           <div className="action-icon">📚</div>
           <h3>Add Book</h3>
        </div>
        <div className="action-card" onClick={() => navigate("/manage-books")}>
           <div className="action-icon">🗑️</div>
           <h3>Inventory</h3>
        </div>
        <div className="action-card" onClick={() => navigate("/users")}>
           <div className="action-icon">👥</div>
           <h3>Users</h3>
        </div>
      </div>
    </div>
  );
}