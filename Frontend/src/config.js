// Central API configuration
// In production, set VITE_API_URL environment variable to your Render backend URL.
// Example: https://bookstore-svbg.onrender.com
// Locally it falls back to http://localhost:5000

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_URL;
