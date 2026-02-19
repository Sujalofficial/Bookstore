require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors()); 

const PORT = 5000;
const MY_SECRET_KEY = "#Sujal7777"; 
const MONGO_URI = 'mongodb://127.0.0.1:27017/bookstoreDB'; 

// --- API KEY SETUP ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBdRkg1NXB8z_N-Tm2jIsLmJ0HcyjRSjgw";

// ==========================================
// 1. CONNECT DB
// ==========================================
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB..."))
    .catch(err => console.error("❌ Could not connect to MongoDB:", err));

// ==========================================
// 2. DEFINE SCHEMAS & MODELS
// ==========================================

// User Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false } 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Book Model
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String } 
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);

// Cart Model
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    title: String,
    price: Number,
    image: String,
    quantity: { type: Number, default: 1 }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

// --- ORDER MODEL (New) ---
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true }, // Admin ko naam dikhane ke liye
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
    address: { type: String, required: true }, // Delivery Address
    status: { 
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'] // Sirf ye values allowed hain
    },
    orderedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ==========================================
// 3. MULTER SETUP
// ==========================================
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// ==========================================
// 4. ADMIN SEEDER (Auto-Create Admin)
// ==========================================
const createAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@gmail.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Super Admin',
                email: 'admin@gmail.com',
                password: hashedPassword,
                isAdmin: true 
            });
            console.log('👑 Admin Account Created!');
        }
    } catch (error) {
        console.error('Seeding Error:', error);
    }
};
createAdminAccount();

// ==========================================
// 🔐 SECURITY MIDDLEWARE (VERIFY ADMIN)
// ==========================================
// Ye function check karega ki request bhejne wala Admin hai ya nahi
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access Denied: No Token Provided!" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, MY_SECRET_KEY);
        // Check if user is actually Admin
        if (decoded.isAdmin !== true) {
            return res.status(403).json({ error: "Forbidden: You are not an Admin!" });
        }
        req.user = decoded; // User info save kar lo aage use karne ke liye
        next(); 
    } catch (err) {
        res.status(401).json({ error: "Invalid or Expired Token" });
    }
};
// 🔐 SECURITY MIDDLEWARE (VERIFY USER)
// Ye check karega ki banda logged-in hai ya nahi (Admin hona zaroori nahi)
const verifyUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access Denied: Please Login First!" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, MY_SECRET_KEY);
        req.user = decoded; // User ki ID save kar li
        next(); 
    } catch (err) {
        res.status(401).json({ error: "Invalid Token" });
    }
};

// ==========================================
// 5. ROUTES
// ==========================================

// --- REGISTER ---
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body; 
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: "User Registered Successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Registration Error" });
    }
});

// --- LOGIN ---
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; 
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid Credentials!" });

        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin }, 
            MY_SECRET_KEY, 
            { expiresIn: '1h' }
        );

        res.json({ 
            token,
            user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
        });
    } catch (error) {
        res.status(500).json({ error: "Login Error" });
    }
});

// --- ADD BOOK ---
app.post('/api/books', upload.single('image'), async (req, res) => {
    try {
        const { title, author, price, category } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
        const newBook = await Book.create({ title, author, price, category, image: imagePath });
        res.status(201).json({ message: "Book Added Successfully!", book: newBook });
    } catch (error) {
        res.status(500).json({ error: "Could not add book" });
    }
});

// --- GET ALL BOOKS ---
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: "Error fetching books" });
    }
});

// --- ADD TO CART ---
app.post('/api/cart/add', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json("Unauthorized: Token missing");
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, MY_SECRET_KEY);
        const activeUserId = decoded.userId;
        const { bookId, title, price, image } = req.body;

        if (!bookId || !title || !price) {
            return res.status(400).json("Missing book details");
        }

        let existingItem = await Cart.findOne({ userId: activeUserId, bookId });

        if (existingItem) {
            existingItem.quantity += 1;
            await existingItem.save();
            return res.json("Item quantity increased in cart");
        }

        await Cart.create({
            userId: activeUserId,
            bookId,
            title,
            price,
            image,
            quantity: 1
        });

        res.json("Book added to cart successfully");
    } catch (err) {
        res.status(401).json("Session expired. Please login again.");
    }
});

// --- GET CART ITEMS ---
app.get('/api/cart/items', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, MY_SECRET_KEY); 
        const cartItems = await Cart.find({ userId: decoded.userId });
        res.json(cartItems);
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }
});

// --- DELETE CART ITEM ---
app.delete('/api/cart/:id', async (req, res) => {
    try {
        await Cart.findByIdAndDelete(req.params.id);
        res.json("Item removed from cart");
    } catch (error) {
        res.status(500).json("Error removing item");
    }
});

// ==========================================
// 👑 ADMIN MANAGEMENT ROUTES (NEW & SECURE)
// ==========================================

// 1. GET ALL USERS (Only Admin can see)
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        // '.select(-password)' ka matlab password frontend par nahi bhejna
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// 2. DELETE USER (Only Admin can delete)
app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        // Admin khud ko delete na kar paye
        if (req.user.userId === req.params.id) {
            return res.status(400).json({ error: "Security Alert: You cannot delete yourself!" });
        }
        
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: "User not found" });
        
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});
// ==========================================
// 📦 ORDER MANAGEMENT ROUTES
// ==========================================

// 1. PLACE ORDER (User Checkout)
// Logic: User ka Cart dhundo -> Order banao -> Cart khali karo
app.post('/api/orders/checkout', verifyUser, async (req, res) => {
    try {
        const { address, customerName } = req.body;
        const userId = req.user.userId;

        // A. User ka Cart dhundo
        const cartItems = await Cart.find({ userId });
        
        if (cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty!" });
        }

        // B. Total Price Calculate karo
        const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // C. Order Create karo
        const newOrder = await Order.create({
            userId,
            customerName,
            books: cartItems.map(item => ({
                bookId: item.bookId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            totalAmount,
            address
        });

        // D. Cart Khali karo (Kyunki order ho gaya)
        await Cart.deleteMany({ userId });

        res.status(201).json({ message: "Order Placed Successfully!", orderId: newOrder._id });

    } catch (error) {
        console.error("Order Error:", error);
        res.status(500).json({ error: "Failed to place order" });
    }
});

// 2. GET MY ORDERS (User History)
app.get('/api/orders/my-orders', verifyUser, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId }).sort({ orderedAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Error fetching orders" });
    }
});

// ==========================================
// 👑 ADMIN ORDER ROUTES (Professional Features)
// ==========================================

// 3. GET ALL ORDERS (Admin Dashboard ke liye)
app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderedAt: -1 });
        
        // Simple Analytics Calculate karo (Bonus!)
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        
        res.json({ orders, totalRevenue, totalOrders: orders.length });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch all orders" });
    }
});

// 4. UPDATE ORDER STATUS (Shipped/Delivered)
app.put('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body; // Frontend se aayega 'Shipped' ya 'Delivered'
        
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status },
            { new: true } // Updated version return karo
        );

        if (!order) return res.status(404).json({ error: "Order not found" });

        res.json({ message: `Order marked as ${status}`, order });
    } catch (error) {
        res.status(500).json({ error: "Failed to update status" });
    }
});

// ==========================================
// 6. AI SUMMARY ROUTE (Gemini 2.5 Flash)
// ==========================================
app.post('/api/ai-summary', async (req, res) => {
    const { title, author, category } = req.body;
    
    if (!title || !author) {
        return res.status(400).json({ error: "Book details missing" });
    }

    // Latest active model
    const modelName = "gemini-2.5-flash"; 
    
    // Direct REST API Call
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const promptText = `
        You are an expert book critic and storyteller. 
        Briefly explain the book "${title}" by ${author} in the genre "${category}".
        
        Cover these 3 points in a continuous engaging paragraph:
        1. The main core concept or plot of the book.
        2. A key lesson, twist, or unique feature.
        3. Who should read this book and why.
        
        Keep the tone professional yet exciting. Limit it to around 60-80 words.
    `;

    const payload = {
        contents: [{
            parts: [{ text: promptText }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ Google API Error:", data.error);
            return res.status(500).json({ error: "AI Error", details: data.error.message });
        }

        const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Summary unavailable.";
        res.json({ summary: summaryText });

    } catch (error) {
        console.error("❌ Network Error:", error.message);
        res.status(500).json({ error: "Network failed", details: error.message });
    }
});
// ==========================================
// 🤖 SMART AI LIBRARIAN (Direct REST API Call)
// ==========================================
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ reply: "Say something! 😅" });
    }

    try {
        // 1. Database se stock nikalo
        const books = await Book.find({}, 'title author price category');
        
        // 2. Stock ko text mein badlo
        const inventoryList = books.map(b => 
            `- "${b.title}" by ${b.author} (Price: ₹${b.price}) [Category: ${b.category}]`
        ).join("\n");

        // 3. API Config (Same like your summary route)
        const modelName = "gemini-2.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        // 4. Librarian Prompt
        const promptText = `
            You are the friendly AI Librarian of 'BookShelf'.
            
            OUR CURRENT STOCK:
            ${inventoryList}

            USER QUESTION: "${message}"

            INSTRUCTIONS:
            1. Recommend books ONLY from the stock list above.
            2. Mention the price.
            3. Keep the answer very short (under 40 words).
            4. If we don't have a book, suggest the closest alternative from our stock.
            5. Use emojis. 📚✨
        `;

        const payload = {
            contents: [{
                parts: [{ text: promptText }]
            }]
        };

        // 5. Direct Fetch Call
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error);
            return res.status(500).json({ reply: "AI is sleeping... try again! 😴" });
        }

        // 6. Response Extract karo
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure what to say. 🤖";
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ Chat Error:", error.message);
        res.status(500).json({ reply: "Network issue! 🌐" });
    }
});
// ==========================================
// 🗺️ SMART AI MENTOR ROADMAP (Inventory + Global Suggestions)
// ==========================================
app.post('/api/ai-roadmap', async (req, res) => {
    const { goal } = req.body;

    if (!goal) return res.status(400).json({ error: "Goal toh batao bhai! 🎯" });

    try {
        // 1. Database se stock nikalo
        const books = await Book.find({}, 'title author category');
        const inventory = books.map(b => `- ${b.title} (${b.category})`).join("\n");

        const modelName = "gemini-2.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        // 2. Updated Prompt (The "Global Mentor" Logic)
        const promptText = `
            You are an elite Career Mentor. A student wants to: "${goal}".
            
            Build a complete 3-4 step learning roadmap. 
            
            RULES:
            1. Check our IN-STORE INVENTORY first:
               ${inventory}
            
            2. For each step:
               - If a relevant book exists in our INVENTORY, suggest it and label it as [AVAILABLE IN OUR STORE].
               - If we DON'T have a top-tier book for that step, suggest the globally BEST book on that topic and label it as [EXTERNAL RECOMMENDATION - NOT IN STOCK].
            
            3. For every book, explain in 1 sentence why it's crucial for the goal.
            4. Keep the tone inspiring and professional.
            5. Use emojis and clear "Step 1, Step 2..." formatting. 🚀
        `;

        const payload = {
            contents: [{
                parts: [{ text: promptText }]
            }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ Google API Error:", data.error);
            return res.status(500).json({ error: "AI Error", details: data.error.message });
        }

        const roadmapText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Roadmap currently unavailable.";
        res.json({ roadmap: roadmapText });

    } catch (error) {
        console.error("❌ Roadmap Network Error:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));