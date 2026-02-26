import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';
import API_URL from './config';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Current Admin ki ID nikalo (Self-delete rokne ke liye)
  const currentUser = JSON.parse(localStorage.getItem("adminUser"));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        navigate("/adminlogin");
        return;
    }

    try {
      // Backend ko Token bhejna zaroori hai (Authorization Header)
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();

      if (res.ok) {
        setUsers(data);
      } else {
        if(res.status === 401 || res.status === 403) {
            alert("Session Expired or Unauthorized");
            navigate("/adminlogin");
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        // UI Optimistic Update (Instant Removal)
        setUsers(users.filter((user) => user._id !== id));
        alert("✅ User deleted successfully!");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      alert("Server Error");
    }
  };

  // --- PRO FEATURE: Smart Search Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Stats Calculation
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.isAdmin).length;

  if (loading) return <div className="loading-box">🔄 Loading Admin Panel...</div>;

  return (
    <div className="manage-container">
      {/* Header & Stats */}
      <div className="header-section">
        <div>
            <h2>👥 Manage Users</h2>
            <p className="subtitle">Overview of all registered accounts</p>
        </div>
        <button onClick={() => navigate("/dashboard")} className="back-btn">⬅ Dashboard</button>
      </div>

      <div className="stats-row">
        <div className="card stat-card">
            <span>Total Users</span>
            <h3>{totalUsers}</h3>
        </div>
        <div className="card stat-card blue">
            <span>Admins</span>
            <h3>{adminCount}</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-box">
        <input 
            type="text" 
            placeholder="🔍 Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User Details</th>
              <th>Role</th>
              <th>Joined On</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-profile">
                        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div className="fw-bold">{user.name}</div>
                            <div className="text-muted">{user.email}</div>
                        </div>
                    </div>
                  </td>
                  <td>
                    {user.isAdmin ? <span className="badge admin">Admin 👑</span> : <span className="badge user">Member</span>}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td align="right">
                    <button 
                        onClick={() => handleDelete(user._id, user.name)}
                        disabled={user._id === currentUser?._id}
                        className={`delete-btn ${user._id === currentUser?._id ? 'disabled' : ''}`}
                    >
                        {user._id === currentUser?._id ? "🚫 Locked" : "Delete 🗑️"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
                <tr><td colSpan="4" align="center" style={{padding: '20px'}}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}