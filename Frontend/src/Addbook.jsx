import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Addbook.css';
import API_URL from './config';

const CATEGORIES = ['Fiction', 'Self-Help', 'Business', 'Technology', 'Thriller', 'Science', 'History', 'Biography'];

export default function Addbook() {
    const navigate = useNavigate();

    const [form, setForm] = useState({ title: '', author: '', price: '', category: '', quantity: '', description: '' });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [totalBooks, setTotalBooks] = useState('—');

    // AI Summary state
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

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

    // ─── AI Summary Generator ───
    const handleGenerateSummary = async () => {
        const t = form.title.trim();
        const a = form.author.trim();
        if (!t || !a) {
            setAiError('Please fill in the Book Title and Author Name first.');
            setTimeout(() => setAiError(''), 3000);
            return;
        }
        setAiGenerating(true);
        setAiError('');
        try {
            const res  = await fetch(`${API_URL}/api/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: t, author: a }),
            });
            const data = await res.json();
            if (res.ok && data.summary) {
                setForm(prev => ({ ...prev, description: data.summary }));
                showToast('✨ Summary Generated!', 'AI description filled in. Feel free to edit it.');
            } else {
                setAiError(data.error || 'AI service unavailable. Try again.');
                setTimeout(() => setAiError(''), 5000);
            }
        } catch {
            setAiError('Could not reach server. Check your connection.');
            setTimeout(() => setAiError(''), 4000);
        } finally {
            setAiGenerating(false);
        }
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
                setForm({ title: '', author: '', price: '', category: '', quantity: '', description: '' });
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
                            <span className="chip-icon">🤖</span>
                            <div>
                                <div className="chip-label">AI Summary</div>
                                <div className="chip-value">Auto-generate</div>
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

                            {/* ── AI Description / Summary ── */}
                            <div className="form-group full-width">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <label style={{ margin: 0 }}>Book Description</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSummary}
                                        disabled={aiGenerating}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 10,
                                            padding: '7px 14px',
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                            cursor: aiGenerating ? 'not-allowed' : 'pointer',
                                            opacity: aiGenerating ? 0.7 : 1,
                                            fontFamily: 'Inter, sans-serif',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                                        }}
                                    >
                                        {aiGenerating ? (
                                            <>
                                                <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                Generating…
                                            </>
                                        ) : (
                                            <>✨ Generate AI Summary</>
                                        )}
                                    </button>
                                </div>
                                {aiError && (
                                    <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 6, background: '#fff1f2', padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca' }}>
                                        ⚠️ {aiError}
                                    </div>
                                )}
                                <textarea
                                    name="description"
                                    placeholder="Write a short description, or click ✨ Generate AI Summary to auto-fill…"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1.5px solid #e5e7eb',
                                        borderRadius: 12,
                                        fontSize: 13.5,
                                        fontFamily: 'Inter, sans-serif',
                                        color: '#374151',
                                        resize: 'vertical',
                                        outline: 'none',
                                        background: '#fcfcff',
                                        lineHeight: 1.6,
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                                    onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                />
                                {form.description && (
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>
                                        {form.description.length} characters
                                    </div>
                                )}
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
                                            >✕</button>
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

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}