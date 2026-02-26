import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Addbook.css';
import API_URL from './config';

const CATEGORIES = ['Fiction', 'Self-Help', 'Business', 'Technology', 'Thriller', 'Science', 'History', 'Biography'];

export default function Addbook() {
    const navigate = useNavigate();

    const [form, setForm] = useState({ title: '', author: '', price: '', category: '', quantity: '' });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [totalBooks, setTotalBooks] = useState('—');

    // Fetch total books count for left panel
    useEffect(() => {
        fetch(`${API_URL}/api/books`)
            .then(r => r.json())
            .then(data => setTotalBooks(data.length))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setImage(null);
        setImagePreview(null);
    };

    const showToast = (title, sub) => {
        setToast({ title, sub });
        setTimeout(() => setToast(null), 3200);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return navigate('/admin-login');
        setLoading(true);

        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        if (image) formData.append('image', image);

        try {
            const res = await fetch(`${API_URL}/api/books`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Book Added! 🎉', `"${form.title}" — ${form.quantity} copies added to inventory`);
                setForm({ title: '', author: '', price: '', category: '', quantity: '' });
                setImage(null);
                setImagePreview(null);
                setTotalBooks(prev => (typeof prev === 'number' ? prev + 1 : prev));
            } else {
                showToast('❌ Error', data.error || 'Failed to add book');
            }
        } catch (err) {
            showToast('❌ Network Error', 'Could not reach the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="addbook-page">

            {/* ── LEFT DECORATIVE PANEL ── */}
            <aside className="addbook-left">
                <div className="left-illustration">
                    <span className="book-stack-icon">📚</span>
                    <h2>Grow Your<br />Library</h2>
                    <p>Add new titles and manage your inventory — all from one clean dashboard.</p>

                    <div className="left-stats">
                        <div className="stat-chip">
                            <span className="chip-icon">🗃️</span>
                            <div>
                                <div className="chip-label">Total Books</div>
                                <div className="chip-value">{totalBooks}</div>
                            </div>
                        </div>
                        <div className="stat-chip">
                            <span className="chip-icon">✍️</span>
                            <div>
                                <div className="chip-label">Fill all fields</div>
                                <div className="chip-value">Image required</div>
                            </div>
                        </div>
                        <div className="stat-chip">
                            <span className="chip-icon">📦</span>
                            <div>
                                <div className="chip-label">Set stock quantity</div>
                                <div className="chip-value">Tracks inventory</div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── RIGHT FORM PANEL ── */}
            <main className="addbook-right">
                <div className="addbook-card">

                    {/* Header */}
                    <div className="card-header">
                        <button className="back-link" onClick={() => navigate('/manage-books')}>
                            ← Back to Inventory
                        </button>
                        <h1>Add New Book</h1>
                        <p>Fill in the details below to list a new book in the store.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">

                            {/* Title */}
                            <div className="form-group full-width">
                                <label>Book Title</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📖</span>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="e.g. The Alchemist"
                                        value={form.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Author */}
                            <div className="form-group full-width">
                                <label>Author Name</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">✍️</span>
                                    <input
                                        type="text"
                                        name="author"
                                        placeholder="e.g. Paulo Coelho"
                                        value={form.author}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Price */}
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">₹</span>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="299"
                                        value={form.price}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="form-group">
                                <label>Stock Quantity</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📦</span>
                                    <input
                                        type="number"
                                        name="quantity"
                                        placeholder="50"
                                        value={form.quantity}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        style={{ paddingRight: '72px' }}
                                    />
                                    <span className="quantity-suffix">copies</span>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="form-group full-width">
                                <label>Category</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🏷️</span>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>Select a category…</option>
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="form-group full-width">
                                <label>Book Cover Image</label>
                                <div className={`file-upload-area ${imagePreview ? 'has-preview' : ''}`}>
                                    {imagePreview ? (
                                        <div className="file-preview">
                                            <img src={imagePreview} alt="preview" />
                                            <div className="file-preview-info">
                                                <strong>{image?.name}</strong>
                                                <span>{(image?.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={removeImage}
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                required
                                            />
                                            <div className="upload-content">
                                                <span className="upload-icon">🖼️</span>
                                                <p>Click or drag & drop to upload</p>
                                                <span>PNG, JPG, WEBP up to 5MB</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>{/* /form-grid */}

                        {/* Submit */}
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="btn-spinner" />
                                    Adding to Inventory…
                                </>
                            ) : (
                                <> 📦 Add Book to Inventory </>
                            )}
                        </button>
                    </form>
                </div>
            </main>

            {/* ── SUCCESS TOAST ── */}
            {toast && (
                <div className="success-toast">
                    <span className="toast-icon">✅</span>
                    <div>
                        <div className="toast-title">{toast.title}</div>
                        <div className="toast-sub">{toast.sub}</div>
                    </div>
                </div>
            )}
        </div>
    );
}