import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import API_URL from "./config";

// Premium SVG Icons
const Icons = {
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  Delete: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  ),
  Add: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  )
};

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const navigate = useNavigate();

  const [editModal, setEditModal] = useState(null);
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books`);
      const data = await res.json();
      setBooks(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDialog) return;
    const { id } = confirmDialog;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBooks(books.filter((book) => book._id !== id));
        setConfirmDialog(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveStock = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/books/${editModal._id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: parseInt(newQty) }),
      });
      if (res.ok) {
        setBooks(prev => prev.map(b => b._id === editModal._id ? { ...b, quantity: parseInt(newQty) } : b));
        setEditModal(null);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout
      title="Inventory"
      subtitle={`${books.length} titles in stock`}
      onRefresh={fetchBooks}
    >
      <div className="animate-fade-in">
        <div className="ap-card">
          <div className="ap-card-header">
            <div className="ap-card-title">Product List</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                className="ap-search-input" 
                placeholder="Search inventory..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button className="ap-btn primary" onClick={() => navigate("/add-book")}>
                <Icons.Add /> Add Book
              </button>
            </div>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map(book => (
                  <tr key={book._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img 
                          src={`${API_URL}${book.image}`} 
                          alt="" 
                          style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                          onError={e => e.target.src = 'https://via.placeholder.com/40'}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{book.title}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="ap-badge">{book.category}</span></td>
                    <td style={{ fontWeight: 700 }}>₹{book.price}</td>
                    <td>
                      <span className={`ap-badge ${book.quantity <= 0 ? 'cancelled' : book.quantity <= 5 ? 'pending' : 'delivered'}`}>
                        {book.quantity} in stock
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="ap-icon-btn" title="Edit Stock" onClick={() => { setEditModal(book); setNewQty(book.quantity); }}>
                          <Icons.Edit />
                        </button>
                        <button className="ap-icon-btn" style={{ color: '#ff4d4f' }} onClick={() => setConfirmDialog({ id: book._id, title: book.title })}>
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Edit Modal */}
      {editModal && (
        <>
          <div className="ap-drawer-backdrop" onClick={() => setEditModal(null)} />
          <div className="ap-modal">
            <div className="ap-card-header">
              <div className="ap-card-title">Update Stock</div>
              <button className="ap-icon-btn" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="ap-card-body" style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600 }}>{editModal.title}</div>
                <div style={{ fontSize: 13, color: '#888' }}>Currently {editModal.quantity} units</div>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">New Quantity</label>
                <input 
                  type="number" 
                  className="ap-input" 
                  value={newQty}
                  onChange={e => setNewQty(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="ap-btn outline" style={{ flex: 1 }} onClick={() => setEditModal(null)}>Cancel</button>
                <button className="ap-btn primary" style={{ flex: 1 }} onClick={handleSaveStock} disabled={saving}>
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {confirmDialog && (
        <>
          <div className="ap-drawer-backdrop" onClick={() => setConfirmDialog(null)} />
          <div className="ap-modal" style={{ maxWidth: 400 }}>
            <div className="ap-card-body" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ marginBottom: 8 }}>Delete Book?</h3>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Are you sure you want to remove <b>{confirmDialog.title}</b>? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="ap-btn outline" style={{ flex: 1 }} onClick={() => setConfirmDialog(null)}>Cancel</button>
                <button className="ap-btn primary" style={{ flex: 1, background: '#ff4d4f' }} onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
