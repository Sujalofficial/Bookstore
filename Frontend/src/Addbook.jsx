import { useState } from 'react';
import API_URL from './config';

export default function Addbook() {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null); // File state

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // FormData use karna zaroori hai Multer ke liye
        const formData = new FormData();
        formData.append('title', title);
        formData.append('author', author);
        formData.append('price', price);
        formData.append('category', category);
        formData.append('image', image); // Actual file

        try {
            const res = await fetch(`${API_URL}/api/books`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                    // Note: 'Content-Type' header mat dena, browser automatic set karega
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                alert("Book with Image Added!");
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h2>Add Book with Cover</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Title" onChange={(e) => setTitle(e.target.value)} required />
                <input type="text" placeholder="Author" onChange={(e) => setAuthor(e.target.value)} required />
                <input type="number" placeholder="Price" onChange={(e) => setPrice(e.target.value)} required />
                <input type="text" placeholder="Category" onChange={(e) => setCategory(e.target.value)} required />
                
                {/* File Input */}
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} required />
                
                <button type="submit">Upload & Save Book</button>
            </form>
        </div>
    );
}