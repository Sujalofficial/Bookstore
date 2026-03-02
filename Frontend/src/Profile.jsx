import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import API_URL from './config';

// ─── ICONS ───
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PackageIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const HeartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const BookOpenIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const ShoppingBagIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const ChevronRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

const STATUS_MAP = {
  Pending:   "pending",
  Shipped:   "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const OrderSkeleton = () => (
  <div className="pf-skeleton-card">
    <div className="pf-skel-header">
      <div className="pf-skel-line" style={{ width: "120px", height: "16px" }}></div>
      <div className="pf-skel-line" style={{ width: "80px", height: "24px", borderRadius: "12px" }}></div>
    </div>
    <div className="pf-skel-line mt-sm" style={{ width: "90px", height: "12px" }}></div>
    <div className="pf-skel-body mt-md">
      <div className="pf-skel-line full-width" style={{ height: "40px", borderRadius: "8px" }}></div>
    </div>
    <div className="pf-skel-footer mt-md">
      <div className="pf-skel-line" style={{ width: "60px", height: "20px" }}></div>
    </div>
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Fake state for form UI saving
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToast("Profile settings updated successfully!");
      setTimeout(() => setToast(null), 3000);
    }, 800);
  };

  if (!user) return null;

  // Placeholder arrays for UI rendering
  const dummyWishlist = []; // Empty to show empty state as requested

  return (
    <div className="pf-app-container">
      {/* ═══ NAVBAR ═══ */}
      <nav className="pf-navbar">
        <div className="pf-nav-inner">
          <div className="pf-brand" onClick={() => navigate("/userhome")}>
            <div className="pf-brand-icon"><BookOpenIcon /></div>
            <span className="pf-brand-text">Bookshelf</span>
          </div>
          <div className="pf-nav-actions">
            <button className="pf-nav-btn" onClick={() => navigate("/userhome")}>
              <HomeIcon /> <span>Home</span>
            </button>
            <button className="pf-nav-btn" onClick={() => navigate("/cart")}>
              <PackageIcon /> <span>Cart</span>
            </button>
            <button className="pf-nav-btn danger" onClick={() => { localStorage.clear(); navigate('/login'); }}>
              <LogOutIcon /> <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN DASHBOARD ═══ */}
      <main className="pf-dashboard">
        <div className="pf-dashboard-layout">

          {/* ─── SIDEBAR NAVIGATION ─── */}
          <aside className="pf-sidebar">
             <div className="pf-sidebar-sticky">
               <h3 className="pf-sidebar-title">My Account</h3>
               <nav className="pf-sidebar-menu">
                  <button 
                    className={`pf-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <UserIcon /> Profile Details
                  </button>
                  <button 
                    className={`pf-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <PackageIcon /> Order History
                    {!loading && orders.length > 0 && <span className="pf-menu-badge">{orders.length}</span>}
                  </button>
                  <button 
                    className={`pf-menu-item ${activeTab === 'wishlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wishlist')}
                  >
                    <HeartIcon /> Wishlist
                  </button>
                  <button 
                    className={`pf-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <SettingsIcon /> Preferences
                  </button>
               </nav>

               {/* Quick Info Card */}
               <div className="pf-quick-info mt-md">
                 <div className="pf-quick-avatar">{user.name.charAt(0).toUpperCase()}</div>
                 <div className="pf-quick-details">
                   <strong>{user.name}</strong>
                   <span>{user.email}</span>
                 </div>
               </div>
             </div>
          </aside>

          {/* ─── MAIN CONTENT ─── */}
          <section className="pf-content">
            
            {/* ══ TAB: PROFILE DETAILS ══ */}
            {activeTab === 'profile' && (
              <div className="pf-tab-content pf-fade-in">
                <div className="pf-page-header">
                  <h2>Profile Details</h2>
                  <p>Manage your personal information and account settings.</p>
                </div>

                {/* Profile Header Card */}
                <div className="pf-card pf-hero-card">
                   <div className="pf-hero-left">
                      <div className="pf-large-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="pf-hero-info">
                         <h3>{user.name}</h3>
                         <p className="text-muted">{user.email}</p>
                         <span className="pf-role-tag">{user.isAdmin ? "Admin User" : "Verified Customer"}</span>
                      </div>
                   </div>
                   <div className="pf-hero-right">
                      <button className="pf-btn pf-btn-secondary" onClick={() => document.getElementById('edit-form').scrollIntoView({behavior: 'smooth'})}>
                        Edit Profile
                      </button>
                   </div>
                </div>

                {/* Edit Profile Form */}
                <div className="pf-card mt-md" id="edit-form">
                   <div className="pf-card-header">
                      <h3>Personal Information</h3>
                   </div>
                   <div className="pf-card-body">
                      <form className="pf-form" onSubmit={handleSaveProfile}>
                         <div className="pf-form-row">
                            <div className="pf-input-group">
                               <label>Full Name</label>
                               <input type="text" defaultValue={user.name} placeholder="John Doe" />
                            </div>
                            <div className="pf-input-group">
                               <label>Email Address</label>
                               <input type="email" defaultValue={user.email} placeholder="john@example.com" disabled title="Email cannot be changed" />
                            </div>
                         </div>
                         <div className="pf-input-group mt-sm">
                            <label>Member ID</label>
                            <input type="text" defaultValue={user._id} disabled />
                            <p className="pf-help-text">Your unique identifier used for internal support.</p>
                         </div>
                         <div className="pf-form-actions mt-md">
                            <button type="submit" className={`pf-btn pf-btn-primary ${isSaving ? 'loading' : ''}`} disabled={isSaving}>
                               {isSaving ? <span className="pf-spinner"></span> : "Save Changes"}
                            </button>
                         </div>
                      </form>
                   </div>
                </div>
              </div>
            )}

            {/* ══ TAB: ORDERS ══ */}
            {activeTab === 'orders' && (
              <div className="pf-tab-content pf-fade-in">
                <div className="pf-page-header">
                  <h2>Order History</h2>
                  <p>Review your past purchases and track current shipments.</p>
                </div>

                {loading ? (
                  <div className="pf-orders-list">
                    <OrderSkeleton />
                    <OrderSkeleton />
                    <OrderSkeleton />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="pf-empty-state">
                    <div className="pf-empty-icon"><ShoppingBagIcon /></div>
                    <h3>No orders yet</h3>
                    <p>When you place an order, it will appear here. Start exploring our library today.</p>
                    <button className="pf-btn pf-btn-primary mt-sm" onClick={() => navigate("/userhome")}>
                      Browse Books
                    </button>
                  </div>
                ) : (
                  <div className="pf-orders-list">
                    {orders.map((order) => (
                      <div key={order._id} className="pf-order-card group">
                        <div className="pf-order-header">
                           <div className="pf-order-meta">
                              <span className="pf-order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                              <span className="pf-order-date">
                                {new Date(order.orderedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <span className={`pf-status-badge ${STATUS_MAP[order.status] || "pending"}`}>
                              {order.status || "Pending"}
                           </span>
                        </div>

                        <div className="pf-order-items">
                           {order.books.map((book, i) => (
                             <div key={i} className="pf-order-item-row">
                               <div className="pf-item-info">
                                 <div className="pf-item-icon"><BookOpenIcon /></div>
                                 <span className="pf-item-title">{book.title}</span>
                               </div>
                               <span className="pf-item-qty">Qty: {book.quantity}</span>
                             </div>
                           ))}
                        </div>

                        <div className="pf-order-footer">
                           <div className="pf-order-total">
                              <span className="text-muted">Total amount</span>
                              <span className="pf-price">₹{order.totalAmount}</span>
                           </div>
                           <button className="pf-btn pf-btn-outline pf-btn-sm">
                             View Details <ChevronRightIcon />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: WISHLIST ══ */}
            {activeTab === 'wishlist' && (
              <div className="pf-tab-content pf-fade-in">
                <div className="pf-page-header">
                  <h2>My Wishlist</h2>
                  <p>Books you've saved to read later.</p>
                </div>

                {dummyWishlist.length > 0 ? (
                  <div className="pf-wishlist-grid">
                     {/* DOM Structure provided visually per requirements, though empty by default */}
                     {dummyWishlist.map(book => (
                       <div key={book._id} className="pf-wishlist-item group">
                          <div className="pf-wish-image">
                             <img src={book.image} alt={book.title} />
                          </div>
                          <div className="pf-wish-details">
                             <h4>{book.title}</h4>
                             <p>{book.author}</p>
                             <span className="pf-wish-price">₹{book.price}</span>
                          </div>
                          <button className="pf-btn pf-btn-ghost pf-wish-remove">Remove</button>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="pf-empty-state">
                    <div className="pf-empty-icon"><HeartIcon /></div>
                    <h3>Your wishlist is empty</h3>
                    <p>Keep track of books you want to read by clicking the heart icon on any book.</p>
                    <button className="pf-btn pf-btn-secondary mt-sm" onClick={() => navigate("/userhome")}>
                      Discover Books
                    </button>
                  </div>
                )}
               </div>
            )}

            {/* ══ TAB: SETTINGS ══ */}
            {activeTab === 'settings' && (
              <div className="pf-tab-content pf-fade-in">
                <div className="pf-page-header">
                  <h2>Preferences</h2>
                  <p>Manage app notifications and appearance.</p>
                </div>

                <div className="pf-card mt-md">
                   <div className="pf-settings-list">
                      <div className="pf-setting-row">
                         <div>
                            <h4>Email Notifications</h4>
                            <p>Receive order updates and promotions via email.</p>
                         </div>
                         <label className="pf-toggle">
                           <input type="checkbox" defaultChecked />
                           <div className="pf-switch"></div>
                         </label>
                      </div>
                      <div className="pf-setting-row">
                         <div>
                            <h4>Marketing SMS</h4>
                            <p>Receive exclusive discount codes directly to your phone.</p>
                         </div>
                         <label className="pf-toggle">
                           <input type="checkbox" />
                           <div className="pf-switch"></div>
                         </label>
                      </div>
                   </div>
                </div>
              </div>
            )}
            
          </section>
        </div>
      </main>

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className="pf-toast pf-slide-up">
          <div className="pf-toast-icon"><CheckCircleIcon /></div>
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}