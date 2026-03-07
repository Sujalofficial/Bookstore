import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API_URL from './config';

const CATEGORIES = ['Fiction', 'Self-Help', 'Business', 'Technology', 'Thriller', 'Science', 'History', 'Biography'];

// Premium SVG Icons
const Icons = {
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  ),
  Image: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  ),
  Upload: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  )
};

export default function Addbook() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', author: '', price: '', category: '', quantity: '', description: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGenerateSummary = async () => {
    if (!form.title || !form.author) return alert('Enter Title and Author first.');
    setAiGenerating(true);
    try {
      const res  = await fetch(`${API_URL}/api/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, author: form.author }),
      });
      const data = await res.json();
      if (res.ok) setForm(prev => ({ ...prev, description: data.summary }));
    } catch (err) { console.error(err); }
    finally { setAiGenerating(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate('/adminlogin');
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
      if (res.ok) {
        alert('Book added successfully!');
        navigate('/manage-books');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <AdminLayout
      title="Add New Book"
      subtitle="Create a new entry in your collection"
    >
      <div className="animate-fade-in" style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} className="ap-card">
          <div className="ap-card-body" style={{ padding: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div className="ap-form-group">
                <label className="ap-label">Book Title</label>
                <input className="ap-input" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. The Great Gatsby" />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Author Name</label>
                <input className="ap-input" name="author" value={form.author} onChange={handleChange} required placeholder="e.g. F. Scott Fitzgerald" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div className="ap-form-group">
                <label className="ap-label">Price (₹)</label>
                <input className="ap-input" type="number" name="price" value={form.price} onChange={handleChange} required placeholder="₹0.00" />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Quantity</label>
                <input className="ap-input" type="number" name="quantity" value={form.quantity} onChange={handleChange} required placeholder="In stock" />
              </div>
            </div>

            <div className="ap-form-group" style={{ marginBottom: 24 }}>
              <label className="ap-label">Category</label>
              <select className="ap-select" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="ap-form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="ap-label" style={{ marginBottom: 0 }}>Description</label>
                <button type="button" className="ap-btn outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={handleGenerateSummary} disabled={aiGenerating}>
                  <Icons.Sparkles /> {aiGenerating ? 'Generating...' : 'AI Summary'}
                </button>
              </div>
              <textarea className="ap-input" name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Tell us about the book..." />
            </div>

            <div className="ap-form-group" style={{ marginBottom: 32 }}>
              <label className="ap-label">Cover Image</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, border: '2px dashed #eee', borderRadius: 12, cursor: 'pointer', background: '#fcfcfc' }}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    <Icons.Upload />
                    <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Click to upload</div>
                  </label>
                </div>
                {imagePreview && (
                  <div style={{ width: 120 }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }} />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="ap-btn primary" style={{ width: '100%', height: 48, fontSize: 15 }} disabled={loading}>
              {loading ? 'Adding to Library...' : 'Ready to Publish'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
