require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    image: { type: String },
    quantity: { type: Number, required: true, default: 0 } // Inventory stock
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
        const bookData = { 
            ...req.body, 
            image: req.file ? `/uploads/${req.file.filename}` : '',
            quantity: parseInt(req.body.quantity) || 0
        };
        const newBook = await Book.create(bookData);
        res.status(201).json(newBook);
    } catch (e) { res.status(500).json("Error adding book"); }
});

// Delete a book (Admin Only)
app.delete('/api/books/:id', verifyAdmin, async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: "Book deleted successfully" });
    } catch (e) { res.status(500).json({ error: "Error deleting book" }); }
});

// Update stock quantity (Admin Only)
app.patch('/api/books/:id/stock', verifyAdmin, async (req, res) => {
    try {
        const newQty = parseInt(req.body.quantity);
        if (isNaN(newQty) || newQty < 0) 
            return res.status(400).json({ error: "Invalid quantity value" });
        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            { quantity: newQty },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Book not found" });
        res.json({ message: "Stock updated successfully", book: updated });
    } catch (e) { res.status(500).json({ error: "Error updating stock" }); }
});

app.post('/api/cart/add', verifyUser, async (req, res) => {
    const { bookId, title, price, image } = req.body;
    try {
        // Check stock availability
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ error: "Book not found" });
        if (book.quantity <= 0) return res.status(400).json({ error: "Out of stock" });

        let item = await Cart.findOne({ userId: req.user.userId, bookId });
        if (item) {
            // Check if enough stock for one more
            if (book.quantity < 1) return res.status(400).json({ error: "Not enough stock" });
            item.quantity += 1;
            await item.save();
        } else {
            await Cart.create({ userId: req.user.userId, bookId, title, price, image });
        }
        // Decrement inventory
        book.quantity -= 1;
        await book.save();
        res.json({ message: "Cart updated", availableStock: book.quantity });
    } catch (e) { res.status(500).json({ error: "Error updating cart" }); }
});

// Remove single cart item & restore stock
app.delete('/api/cart/:bookId', verifyUser, async (req, res) => {
    try {
        const item = await Cart.findOne({ userId: req.user.userId, bookId: req.params.bookId });
        if (!item) return res.status(404).json({ error: "Item not in cart" });
        // Restore stock
        await Book.findByIdAndUpdate(req.params.bookId, { $inc: { quantity: item.quantity } });
        await item.deleteOne();
        res.json({ message: "Item removed, stock restored" });
    } catch (e) { res.status(500).json({ error: "Error removing cart item" }); }
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

// ==========================================
// 🤖 AI HELPER — Google Generative AI SDK
// ==========================================
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const fetchGemini = async (prompt) => {
    try {
        // gemini-2.0-flash with v1 API version (supported for free tier)
        const model = genAI.getGenerativeModel(
            { model: 'gemini-2.5-flash' },
            { apiVersion: 'v1' }
        );
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        const msg = err.message || '';
        if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
            console.error('⚠️  Gemini quota exceeded:', msg.split('\n')[0]);
            return '__QUOTA_EXCEEDED__';
        }
        console.error('❌ Gemini API Error:', msg.split('\n')[0]);
        return null;
    }
};


// AI Book Summary
app.post('/api/ai-summary', async (req, res) => {
    try {
        const { title, author } = req.body;
        if (!title || !author) return res.status(400).json({ error: 'Title and author are required' });
        const prompt = `Summarize the book "${title}" by ${author} in exactly 60 words. Be professional, engaging, and highlight what makes it special.`;
        const summary = await fetchGemini(prompt);
        if (summary === '__QUOTA_EXCEEDED__') return res.status(429).json({ error: '⚠️ AI quota exceeded for today. Please try again tomorrow or upgrade your Gemini API plan.' });
        if (!summary) return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
        res.json({ summary });
    } catch (err) {
        console.error('AI Summary error:', err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// AI Reading Roadmap
app.post('/api/ai-roadmap', async (req, res) => {
    try {
        const { goal } = req.body;
        if (!goal) return res.status(400).json({ error: 'Goal is required' });

        const books = await Book.find({}, 'title author category').lean();
        const bookList = books.map(b => `"${b.title}" by ${b.author} (${b.category})`).join('\n');

        const prompt = `You are a reading roadmap expert. A user wants to: "${goal}".

Create a structured, step-by-step learning roadmap with 5-7 stages. For each stage:
- Give it a clear title
- Explain what to learn/focus on (2-3 sentences)
- Recommend 1-2 books. If any book from our store matches, mark it as [AVAILABLE IN OUR STORE]. Otherwise mark it as [EXTERNAL RECOMMENDATION].

Our store currently has these books:
${bookList || 'No books currently in inventory.'}

Format the response clearly with numbered stages. Keep it motivating and actionable.`;

        const roadmap = await fetchGemini(prompt);
        if (roadmap === '__QUOTA_EXCEEDED__') return res.status(429).json({ error: '⚠️ AI quota exceeded for today. Please try again tomorrow or upgrade your Gemini API plan.' });
        if (!roadmap) return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
        res.json({ roadmap });
    } catch (err) {
        console.error('AI Roadmap error:', err);
        res.status(500).json({ error: 'Failed to generate roadmap' });
    }
});

// ==========================================
// 🤖 CHATBOT ROUTE (with live inventory context)
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) return res.status(400).json({ reply: "Please send a message." });

        // 1. Fetch live inventory from DB
        const books = await Book.find({}, 'title author price category quantity').lean();

        // 2. Format inventory as a readable list for Gemini context
        const inventoryContext = books.length > 0
            ? books.map(b => 
                `- "${b.title}" by ${b.author} | Category: ${b.category} | Price: ₹${b.price} | Stock: ${b.quantity > 0 ? `${b.quantity} copies available` : 'OUT OF STOCK'}`
              ).join('\n')
            : 'No books currently in inventory.';

        // 3. Build the prompt with inventory context
        const prompt = `You are a helpful assistant for BOOKSHELF — an online bookstore. 
You have access to the current live inventory listed below. Use this data to answer the user's question accurately.

=== CURRENT INVENTORY ===
${inventoryContext}
=========================

User's question: "${userMessage}"

Instructions:
- If the user asks about stock/availability of a specific book, check the inventory above and tell them exactly how many copies are left.
- If a book is OUT OF STOCK, clearly say so.
- If the user asks for book recommendations, suggest books from the inventory that are in stock.
- Keep your reply friendly, concise (under 100 words), and helpful.
- Do not make up books that aren't in the inventory.`;

        // 4. Call Gemini with the inventory-aware prompt
        const reply = await fetchGemini(prompt);
        if (reply === '__QUOTA_EXCEEDED__') return res.json({ reply: '⚠️ AI quota exceeded for today. The free-tier daily limit has been reached. Please try again tomorrow!' });
        if (!reply) return res.json({ reply: 'Sorry, AI is temporarily unavailable. Please try again shortly! 😅' });
        res.json({ reply });

    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ reply: "Sorry, I'm having trouble right now. Please try again! 😅" });
    }
});

// ==========================================
// 🚀 START SERVER
// ==========================================

// Health check — so Render doesn't show "Cannot GET /"
app.get('/', (req, res) => {
    res.json({ 
        message: '📚 Bookstore API is running!',
        status: 'OK',
        endpoints: '/api/books | /api/cart | /api/orders | /api/chat | /login | /register'
    });
});

// 404 catch-all for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 Static files served at: http://localhost:${PORT}/uploads`);
});
