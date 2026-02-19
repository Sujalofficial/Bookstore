import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Adminlogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      if (data.user.isAdmin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        alert("Hello Boss! Access Granted.");
        navigate('/dashboard'); // Later, change this to /admin-dashboard
      } else {
        alert("Access Denied: You are not an Admin!");
      }
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="auth-container" style={{ border: '2px solid red', padding: '20px' }}>
      <h2 style={{ color: 'red' }}>Admin Portal</h2>
      <form onSubmit={handleAdminLogin}>
        <input type="email" placeholder="Admin Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={{ backgroundColor: 'red', color: 'white' }}>Login as Admin</button>
      </form>
    </div>
  );
}

export default Adminlogin;