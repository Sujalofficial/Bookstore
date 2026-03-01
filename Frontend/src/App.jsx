import { useState } from "react";
import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";

// 1. Import your pages
import Home from "./Home";
import Register from "./Register";
import Userlogin from "./Userlogin";
import Adminlogin from "./Adminlogin";
import Admindashboard from "./Admindashboard";
import Addbook from "./Addbook";
import Userhome from "./Userhome";
import Cart from "./Cart";
import Profile from "./Profile";
import Users from "./Users";
import Checkout from "./Checkout";
import ManageBooks from "./ManageBooks";
import AdminOrders from "./AdminOrders";
import ChatBot from "./ChatBot";
import Roadmap from "./Roadmap";
// AdminLayout is used internally by admin pages — no need to import here

function App() {
  const location = useLocation(); // ✅ Current path check karne ke liye

  // --- 🔒 ChatBot Logic ---
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Sirf in raaston par aur logged-in user ko chatbot dikhega
  const userSidePaths = ["/userhome", "/cart", "/profile", "/checkout", "/roadmap"];
  // Removed !user.isAdmin and explicit userSidePaths restriction at user's request
  const hiddenPaths = ["/login", "/register", "/adminlogin"];
  const isChatVisible = !hiddenPaths.includes(location.pathname);

  return (
    <>
      {/* The Routes Container */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />   
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Userlogin />} />
        <Route path="/adminlogin" element={<Adminlogin />} />
        <Route path="/dashboard" element={<Admindashboard />} />
        <Route path="/add-book" element={<Addbook />} />
        <Route path="/userhome" element={<Userhome />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={<Users/>} />
        <Route path="/checkout" element={<Checkout/>} />
        <Route path="/manage-books" element={<ManageBooks />}/>
        <Route path="/admin/orders" element={<AdminOrders />}/>
        <Route path="/roadmap" element={<Roadmap />} />

        {/* Admin Route */}
        {/* <Route path="/admin" element={<Admin />} /> */}
      </Routes>

      {/* ✅ Conditional Rendering: Sirf tab dikhega jab user login ho aur allowed path pe ho */}
      {isChatVisible && <ChatBot />}
    </>
  );
}

export default App;