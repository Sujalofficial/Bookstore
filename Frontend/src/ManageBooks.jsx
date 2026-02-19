import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageBooks.css"; // CSS niche hai

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // 1. Fetch Books
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/books");
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error("Error fetching books");
    } finally {
      setLoading(false);
    }
  };

  // 2. Delete Book Function
  const handleDelete = async (id, title) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete "${title}"?\nThis action cannot be undone.`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBooks(books.filter((book) => book._id !== id));
        alert("✅ Book deleted successfully!");
      } else {
        alert("Failed to delete book.");
      }
    } catch (err) {
      alert("Server Error");
    }
  };

  // Search Filter
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-screen">Loading Inventory...</div>;

  return (
    <div className="inventory-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>📚 Manage Inventory</h2>
          <p>Total Books: {books.length}</p>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <tr key={book._id}>
                  <td>
                    <img 
                        src={`http://localhost:5000${book.image}`} 
                        alt="cover" 
                        className="book-thumb"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                    />
                  </td>
                  <td>
                    <div className="book-title">{book.title}</div>
                    <div className="book-author">by {book.author}</div>
                  </td>
                  <td><span className="cat-badge">{book.category}</span></td>
                  <td className="price-text">₹{book.price}</td>
                  <td>
                    <button 
                        className="delete-action-btn"
                        onClick={() => handleDelete(book._id, book.title)}
                    >
                        🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="no-data">No books found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}