require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
const multer = require('multer');
const path = require('path');

const app = express();

// ==========================================
// ⚙️ CONFIGURATION (Atlas & Production Ready)
// ==========================================
app.use(express.json());
app.use(cors()); 

// Variables from .env
const PORT = process.env.PORT || 5000;
const MY_SECRET_KEY = process.env.MY_SECRET_KEY || "#Sujal7777"; 
const MONGO_URI = process.env.MONGO_URI; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ==========================================
// 1. CONNECT DB (MongoDB Atlas)
// ==========================================

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ SUCCESS: Connected to MongoDB Atlas Cloud!"))
    .catch(err => {
        console.error("❌ ERROR: Could not connect to MongoDB Atlas.");
        console.error("Detail:", err.message);
        console.log("Tip: Check if your IP is whitelisted (0.0.0.0/0) in Atlas.");
    });

// ==========================================
// 2. DEFINE SCHEMAS & MODELS
// ==========================================

// User Model
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false } 
}, { timestamps: true }));

// Book Model
const Book = mongoose.model('Book', new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String } 
}, { timestamps: true }));

// Cart Model
const Cart = mongoose.model('Cart', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    title: String,
    price: Number,
    image: String,
    quantity: { type: Number, default: 1 }
}, { timestamps: true }));

// Order Model
const Order = mongoose.model('Order', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    books: [
        {
            bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
            title: String,
            price: Number,
            quantity: Number,
            image: String
        }
    ],
    totalAmount: { type: Number, required: true },
    address: { type: String, required: true },
    status: { 
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'] 
    },
    orderedAt: { type: Date, default: Date.now }
}));

// ==========================================
// 3. MULTER & STATIC FILES
// ==========================================
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// ==========================================
// 🔐 MIDDLEWARES
// ==========================================
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Access Denied!" });
    
    try {
        const decoded = jwt.verify(authHeader.split(" ")[1], MY_SECRET_KEY);
        if (!decoded.isAdmin) return res.status(403).json({ error: "Admin Only!" });
        req.user = decoded;
        next(); 
    } catch (err) { res.status(401).json({ error: "Invalid Token" }); }
};

const verifyUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Login First!" });
    
    try {
        req.user = jwt.verify(authHeader.split(" ")[1], MY_SECRET_KEY);
        next(); 
    } catch (err) { res.status(401).json({ error: "Invalid Session" }); }
};

// ==========================================
// 4. AUTH & ADMIN ROUTES
// ==========================================

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body; 
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: "Registered Successfully!" });
    } catch (error) { res.status(500).json({ error: "Registration failed" }); }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, MY_SECRET_KEY, { expiresIn: '1d' });
        res.json({ token, user: { name: user.name, isAdmin: user.isAdmin } });
    } catch (error) { res.status(500).json({ error: "Login error" }); }
});

// ==========================================
// 5. BOOK & CART ROUTES
// ==========================================

app.get('/api/books', async (req, res) => {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
});

app.post('/api/books', upload.single('image'), async (req, res) => {
    try {
        const bookData = { ...req.body, image: req.file ? `/uploads/${req.file.filename}` : '' };
        const newBook = await Book.create(bookData);
        res.status(201).json(newBook);
    } catch (e) { res.status(500).json("Error adding book"); }
});

app.post('/api/cart/add', verifyUser, async (req, res) => {
    const { bookId, title, price, image } = req.body;
    let item = await Cart.findOne({ userId: req.user.userId, bookId });
    if (item) {
        item.quantity += 1;
        await item.save();
    } else {
        await Cart.create({ userId: req.user.userId, bookId, title, price, image });
    }
    res.json("Cart updated");
});

app.get('/api/cart/items', verifyUser, async (req, res) => {
    const items = await Cart.find({ userId: req.user.userId });
    res.json(items);
});

// ==========================================
// 6. ORDER & AI ROUTES
// ==========================================

app.post('/api/orders/checkout', verifyUser, async (req, res) => {
    const cartItems = await Cart.find({ userId: req.user.userId });
    if (!cartItems.length) return res.status(400).json("Cart empty");
    
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const order = await Order.create({
        userId: req.user.userId,
        customerName: req.body.customerName,
        books: cartItems,
        totalAmount: total,
        address: req.body.address
    });
    await Cart.deleteMany({ userId: req.user.userId });
    res.status(201).json(order);
});

// AI Feature Helper
const fetchGemini = async (prompt) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI currently unavailable";
};

app.post('/api/ai-summary', async (req, res) => {
    const prompt = `Summarize book "${req.body.title}" by ${req.body.author} in 60 words. Tone: Professional.`;
    const summary = await fetchGemini(prompt);
    res.json({ summary });
});

// ==========================================
// 🚀 START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 Static files served at: http://localhost:${PORT}/uploads`);
});