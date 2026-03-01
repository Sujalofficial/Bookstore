import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import AdminLayout from "./AdminLayout";
import API_URL from "./config";

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const navigate = useNavigate();

  // Edit stock modal
  const [editModal, setEditModal] = useState(null);
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
        fetchBooks();
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, categoryFilter, sortOrder, page]);

  const fetchBooks = async (isRefresh = false) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/adminlogin");
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/books?page=${page}&limit=10&search=${searchTerm}&category=${categoryFilter}&sort=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
        setTotalPages(data.pages || 1);
        setTotalBooks(data.total || 0);
        if (isRefresh) toast.success("Inventory refreshed");
      }
    } catch (err) {
      toast.error("Error fetching inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`⚠️ Delete "${title}"? (Soft Delete)`)) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBooks(books.filter((book) => book._id !== id));
        toast.success(`Removed "${title}"`);
        setTotalBooks(prev => prev - 1);
      } else {
        toast.error("Failed to delete book");
      }
    } catch (err) { toast.error("Server error"); }
  };

  const handleToggleVisibility = async (id, currentVis, title) => {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_URL}/api/books/${id}/visibility`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isVisible: !currentVis }),
        });
        if(res.ok) {
            setBooks(books.map(b => b._id === id ? { ...b, isVisible: !currentVis } : b));
            toast.success(`"${title}" is now ${!currentVis ? 'Visible' : 'Hidden'}`);
        } else toast.error('Failed to change visibility');
    } catch(err) { toast.error('Server error'); }
  };

  const openEditModal = (book) => {
    setEditModal(book);
    setNewQty(String(book.quantity));
  };

  const handleSaveStock = async () => {
    if (newQty === "" || isNaN(newQty) || parseInt(newQty) < 0) {
      toast.error("Invalid quantity"); return;
    }
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/books/${editModal._id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: parseInt(newQty) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBooks((prev) => prev.map((b) => b._id === editModal._id ? { ...b, quantity: parseInt(newQty) } : b));
        setEditModal(null);
        toast.success(`Stock updated to ${newQty}`);
      } else {
        toast.error(data.error || "Could not update stock");
      }
    } catch (err) { toast.error("Server error"); } 
    finally { setSaving(false); }
  };

  const categories = ["Fiction", "Self-Help", "Business", "Technology", "Science", "Biography", "Philosophy"];

  return (
    <AdminLayout
      title="Inventory Management"
      subtitle={`${totalBooks} active products in catalog`}
      onRefresh={() => fetchBooks(true)}
      refreshing={refreshing}
    >
      <div className="ap-card">
        <div className="ap-card-header" style={{ flexWrap: 'wrap' }}>
          <span className="ap-card-title">Product Catalog</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }}
            >
                <option value="createdAt">Newest First</option>
                <option value="price">Price (Highest)</option>
                <option value="quantity">Stock Level</option>
            </select>
            <input
              className="ap-search-input"
              placeholder="🔍 Search title..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="ap-loading"><div className="ap-spinner"/><p>Loading inventory…</p></div>
        ) : books.length === 0 ? (
          <div className="ap-empty"><div className="ap-empty-icon">📚</div><h3>No books found</h3></div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {book.image ? <img src={book.image.startsWith('http') ? book.image : `${API_URL}${book.image}`} alt={book.title} style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}/> : <div style={{width: 44, height: 60, background: '#f3f4f6', borderRadius: 6}}></div>}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: 14 }}>{book.title}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>by {book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="ap-badge user">{book.category}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{book.price}</td>
                    <td>
                        {book.quantity <= 0 ? (
                            <span className="ap-badge cancelled">❌ Out of Stock</span>
                        ) : book.quantity <= 5 ? (
                            <span className="ap-badge pending">⚠️ Low: {book.quantity}</span>
                        ) : (
                            <span className="ap-badge delivered">✅ {book.quantity} in stock</span>
                        )}
                    </td>
                    <td>
                        <button 
                            className={`ap-badge ${book.isVisible ? 'admin' : 'user'}`} 
                            style={{ border: 'none', cursor: 'pointer' }}
                            onClick={() => handleToggleVisibility(book._id, book.isVisible, book.title)}
                        >
                            {book.isVisible ? '👁️ Visible' : '🙈 Hidden'}
                        </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ap-btn primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openEditModal(book)}>Stock</button>
                        <button className="ap-btn danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleDelete(book._id, book.title)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Edit Stock Modal */}
      {editModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div style={{ background: 'var(--card-bg, #fff)', width: 340, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main, #111)', fontSize: 16 }}>Update Stock</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{editModal.title}</p>
                  </div>
                  <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                          <button className="ap-btn subtle" onClick={() => setNewQty(v => String(Math.max(0, parseInt(v || 0) - 1)))}>-</button>
                          <input type="number" style={{ flex: 1, padding: '8px 12px', textAlign: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none' }} value={newQty} onChange={e => setNewQty(e.target.value)} />
                          <button className="ap-btn subtle" onClick={() => setNewQty(v => String(parseInt(v || 0) + 1))}>+</button>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                          <button className="ap-btn subtle" style={{ flex: 1 }} onClick={() => setEditModal(null)}>Cancel</button>
                          <button className="ap-btn primary" style={{ flex: 1 }} onClick={handleSaveStock} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </AdminLayout>
  );
}