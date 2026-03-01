import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageBooks.css";
import API_URL from "./config";

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // ── Edit Stock Modal State ──
  const [editModal, setEditModal] = useState(null); // { book } or null
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // 1. Fetch Books
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books`);
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error("Error fetching books");
    } finally {
      setLoading(false);
    }
  };

  // 2. Delete Book
  const handleDelete = async (id, title) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete "${title}"?\nThis action cannot be undone.`)) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBooks(books.filter((book) => book._id !== id));
        showToast("✅ Deleted", `"${title}" removed from inventory.`, "success");
      } else {
        showToast("❌ Error", "Failed to delete book.", "error");
      }
    } catch (err) {
      showToast("❌ Error", "Server error.", "error");
    }
  };

  // 3. Open Edit Stock Modal
  const openEditModal = (book) => {
    setEditModal(book);
    setNewQty(String(book.quantity));
  };

  // 4. Save Stock
  const handleSaveStock = async () => {
    if (newQty === "" || isNaN(newQty) || parseInt(newQty) < 0) {
      showToast("⚠️ Invalid", "Please enter a valid quantity (0 or more).", "error");
      return;
    }
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/books/${editModal._id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: parseInt(newQty) }),
      });
      const data = await res.json();
      if (res.ok) {
        // Optimistic update — reflect new qty instantly in table
        setBooks((prev) =>
          prev.map((b) =>
            b._id === editModal._id ? { ...b, quantity: parseInt(newQty) } : b
          )
        );
        setEditModal(null);
        showToast("✅ Stock Updated!", `"${data.book.title}" → ${newQty} copies.`, "success");
      } else {
        showToast("❌ Failed", data.error || "Could not update stock.", "error");
      }
    } catch (err) {
      showToast("❌ Error", "Server error. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Toast helper
  const showToast = (title, sub, type) => {
    setToast({ title, sub, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Stock badge helper
  const getStockBadge = (qty) => {
    if (qty <= 0)   return { label: "❌ Out of Stock",  bg: "#fdecea", color: "#c62828" };
    if (qty <= 5)   return { label: `⚠️ Low — ${qty} left`, bg: "#fff8e1", color: "#e65100" };
    return          { label: `📦 ${qty} in stock`,      bg: "#e8f5e9", color: "#2e7d32" };
  };

  // Search Filter
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-screen">Loading Inventory...</div>;

  return (
    <div className="inventory-container">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>📚 Manage Inventory</h2>
          <p>Total Books: {books.length} &nbsp;|&nbsp; Out of Stock: {books.filter(b => b.quantity <= 0).length}</p>
        </div>
        <div className="header-actions">
          <button className="add-btn" onClick={() => navigate("/add-book")}>+ Add New Book</button>
          <button className="back-btn" onClick={() => navigate("/dashboard")}>⬅ Dashboard</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search by book title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Book Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => {
                const badge = getStockBadge(book.quantity);
                return (
                  <tr key={book._id}>
                    <td>
                      <img
                        src={`${API_URL}${book.image}`}
                        alt="cover"
                        className="book-thumb"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/50")}
                      />
                    </td>
                    <td>
                      <div className="book-title">{book.title}</div>
                      <div className="book-author">by {book.author}</div>
                    </td>
                    <td><span className="cat-badge">{book.category}</span></td>
                    <td className="price-text">₹{book.price}</td>
                    <td>
                      <span className="stock-badge" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="edit-stock-btn"
                          onClick={() => openEditModal(book)}
                          title="Edit Stock"
                        >
                          ✏️ Edit Stock
                        </button>
                        <button
                          className="delete-action-btn"
                          onClick={() => handleDelete(book._id, book.title)}
                          title="Delete Book"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6" className="no-data">No books found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── EDIT STOCK MODAL ── */}
      {editModal && (
        <div className="modal-backdrop" onClick={() => setEditModal(null)}>
          <div className="stock-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-top">
              <div className="modal-book-info">
                <img
                  src={`${API_URL}${editModal.image}`}
                  alt="cover"
                  className="modal-thumb"
                  onError={(e) => (e.target.src = "https://via.placeholder.com/60")}
                />
                <div>
                  <h3>{editModal.title}</h3>
                  <p>by {editModal.author}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>

            <div className="modal-current-stock">
              <span>Current Stock:</span>
              <span
                className="stock-badge"
                style={{
                  ...(() => {
                    const b = getStockBadge(editModal.quantity);
                    return { background: b.bg, color: b.color };
                  })(),
                }}
              >
                {getStockBadge(editModal.quantity).label}
              </span>
            </div>

            <label className="qty-label">Set New Quantity</label>
            <div className="qty-input-row">
              <button
                className="qty-stepper"
                onClick={() => setNewQty((v) => String(Math.max(0, parseInt(v || 0) - 1)))}
                disabled={saving}
              >−</button>
              <input
                type="number"
                className="qty-input"
                value={newQty}
                min="0"
                onChange={(e) => setNewQty(e.target.value)}
                disabled={saving}
              />
              <button
                className="qty-stepper"
                onClick={() => setNewQty((v) => String(parseInt(v || 0) + 1))}
                disabled={saving}
              >+</button>
            </div>

            <div className="modal-actions">
              <button className="cancel-modal-btn" onClick={() => setEditModal(null)} disabled={saving}>
                Cancel
              </button>
              <button className="save-stock-btn" onClick={handleSaveStock} disabled={saving}>
                {saving ? <><span className="btn-spin" /> Saving…</> : "💾 Save Stock"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`manage-toast ${toast.type}`}>
          <span>{toast.title}</span>
          <span className="toast-sub">{toast.sub}</span>
        </div>
      )}

    </div>
  );
}