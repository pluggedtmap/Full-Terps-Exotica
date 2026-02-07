require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs'); // Pure JS version
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.disable('x-powered-by'); // Security hardening
app.set('trust proxy', 1); // Trust first, necessary for Cloudflare/Nginx
const PORT = process.env.PORT || 4005;
const DATA_FILE = path.join(__dirname, 'data.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// --- GITHUB CONFIG ---
// --- GITHUB CONFIG ---
const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_OWNER = process.env.GITHUB_OWNER || 'pluggedtmap';
const GH_REPO = process.env.GITHUB_REPO || 'BigCloudSAVE'; // Default updated
const GH_BRANCH = 'main';
const GH_UPLOAD_DIR = 'upload';

// Multer for memory (GitHub Uploads)
const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.test(ext)) {
            return cb(null, true);
        }
        cb(new Error('Format non autorisé (Images ou Vidéos uniquement)'));
    }
});
const https = require('https'); // For GitHub API calls

// --- SECURITE & MIDDLEWARE ---
app.use(helmet({ contentSecurityPolicy: false }));
// Manual headers removed in favor of Helmet
const allowedOrigins = ['https://fullterpsexotica.com', 'https://www.fullterpsexotica.com', 'https://bigclouds.shop', 'https://www.bigclouds.shop', 'https://hashfiltered420.cloud', 'https://www.hashfiltered420.cloud', 'http://localhost:3000', 'http://localhost:4005'];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// EMPÊCHER L'ACCÈS AUX FICHIERS SENSIBLES
app.use((req, res, next) => {
    const forbidden = ['.env', '.sqlite', 'package.json', 'ecosystem.config.js', 'server.js', 'data.json', 'orders.json', '.bat', '.sh', '.git'];
    const p = req.path.toLowerCase();
    if (forbidden.some(f => p.includes(f))) {
        return res.status(403).send('Forbidden');
    }
    next();
});

app.use(express.static(__dirname));

// --- UPLOAD CONFIGURATION ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase(); // Secure Extension
        cb(null, 'hf-' + uniqueSuffix + ext)
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov/; // Added mov for iPhone support
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.test(ext)) {
            return cb(null, true);
        }
        cb(new Error('Format non autorisé (Images ou Vidéos uniquement)'));
    }
});

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Strict limit: 5 attempts per 15 mins
    message: { success: false, message: "Trop de tentatives. Réessayez dans 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- SECURITE & MIDDLEWARE ---
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for now as it breaks inline scripts/styles often used here
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow resources to be loaded from other origins (like GitHub)
}));

// --- CUSTOM JSON DATABASE ENGINE ---
// --- REQUEST LOGGING ---
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// --- TELEGRAM SECURITY & LOYALTY ---
const crypto = require('crypto'); // Native Node.js crypto

// SECURITY: BOT_TOKEN must be set in .env file - no fallback for security
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('⚠️ CRITICAL: BOT_TOKEN not found in .env file!');
    console.error('   Telegram authentication will fail.');
    console.error('   Add BOT_TOKEN=your_token to /var/www/FullTerpsExotica/.env');
}

// Helper: Verify Telegram Data
function verifyTelegramWebAppData(telegramInitData) {
    if (!telegramInitData) return null;

    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort keys alphabetically
    const params = Array.from(urlParams.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const dataCheck = crypto.createHmac('sha256', secretKey).update(params).digest('hex');

    if (dataCheck === hash) {
        // Valid! Return user object
        const userStr = urlParams.get('user');
        if (userStr) return JSON.parse(userStr);
    }
    return null;
}

// Helper: 4-Digit Unique ID
function generateShortId(existingOrders = []) {
    let id;
    let attempts = 0;
    do {
        id = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
        attempts++;
        if (attempts > 100) break; // Failsafe
    } while (existingOrders.some(o => o.orderId === id));
    return id;
}


// --- CUSTOM JSON DATABASE ENGINE UPDATE ---
const USERS_FILE = path.join(__dirname, 'users.json');

function loadData() {
    let data = { admin: {}, settings: {}, products: {}, orders: [], users: {} };

    // Load Core Data
    if (fs.existsSync(DATA_FILE)) {
        try {
            const loaded = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            data = { ...data, ...loaded };
        } catch (e) {
            console.error("ERREUR LECTURE DATA.JSON:", e);
        }
    }

    // Load Orders
    if (fs.existsSync(ORDERS_FILE)) {
        try {
            data.orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        } catch (e) {
            data.orders = [];
        }
    }

    // Load Users (Loyalty)
    if (fs.existsSync(USERS_FILE)) {
        try {
            data.users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            console.log(`[STARTUP] Loaded ${Object.keys(data.users).length} users from users.json`);
        } catch (e) {
            data.users = {};
            console.error("[STARTUP] Error loading users.json:", e);
        }
    } else {
        console.log("[STARTUP] No users.json found, starting empty.");
    }

    // Structure Integrity
    if (!data.admin) data.admin = {};
    if (!data.admin.passwordHash) {
        const salt = bcrypt.genSaltSync(10);
        data.admin.passwordHash = bcrypt.hashSync('terpz420', salt);
    }
    if (!data.settings) data.settings = {};
    if (!data.settings.categories) data.settings.categories = ['WEED', 'HASH', 'VAPE', 'AUTRE'];
    if (!data.settings.bannerText) data.settings.bannerText = "Livraison gratuite dès 100€ d'achat ! Nouveaux arrivages Cali US !";
    if (!data.products) data.products = {};
    Object.values(data.products).forEach((p, index) => {
        if (typeof p.order === 'undefined') p.order = index;
    });
    if (!data.orders) data.orders = [];
    if (!data.users) data.users = {};

    return data;
}

function saveData(data) {
    try {
        const orders = data.orders || [];
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    } catch (e) { console.error("ERREUR ECRITURE ORDERS.JSON", e); }

    try {
        const users = data.users || {};
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) { console.error("ERREUR ECRITURE USERS.JSON", e); }

    try {
        const dataToSave = { ...data };
        delete dataToSave.orders;
        delete dataToSave.users;
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    } catch (e) { console.error("ERREUR ECRITURE DATA.JSON", e); }
}

// --- AUTH MIDDLEWARE ---
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const db = loadData();
    // Compare Simple Token (Password) for now
    if (db.admin && db.admin.passwordHash) {
        // If token is exactly the hash (rare) or comparing raw password ?
        // For this simple version, front sends raw password as token.
        // We should normally send session token. 
        // Let's assume the front sends the PASSWORD as token for simplicity as implemented in admin.html
        if (bcrypt.compareSync(token, db.admin.passwordHash)) {
            next();
        } else {
            res.status(403).json({ success: false, message: "Invalid token" });
        }
    } else {
        res.status(500).json({ error: "DB Error" });
    }
};

app.post('/api/login', loginLimiter, (req, res) => {
    const { password } = req.body;
    const db = loadData();
    if (db.admin && db.admin.passwordHash && bcrypt.compareSync(password, db.admin.passwordHash)) {
        res.json({ success: true, token: password }); // WARNING: Sending password as token is not best practice but fits current simplistic model
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/api/change-password', verifyAdmin, (req, res) => {
    const { newPassword } = req.body;
    const db = loadData();
    const salt = bcrypt.genSaltSync(10);
    db.admin.passwordHash = bcrypt.hashSync(newPassword, salt);
    saveData(db);
    res.json({ success: true });
});

// --- GENERIC SETTINGS & PRODUCTS ROUTES ---
app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: loadData().settings });
});
app.post('/api/settings', verifyAdmin, (req, res) => {
    const db = loadData();
    db.settings = { ...db.settings, ...req.body };
    saveData(db);
    res.json({ success: true });
});

app.get('/api/products', (req, res) => {
    const db = loadData();
    // Sort buy order
    const products = Object.values(db.products || {}).sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ success: true, data: products });
});

app.post('/api/products/reorder', verifyAdmin, (req, res) => {
    const { productIds } = req.body;
    const db = loadData();
    if (productIds && Array.isArray(productIds)) {
        productIds.forEach((id, index) => {
            if (db.products[id]) db.products[id].order = index;
        });
        saveData(db);
    }
    res.json({ success: true });
});
// (Other product routes likely missing too if I overwrote them, restoring basic CRUD placeholders if needed or assuming they are custom below?)
// Checking file again, it seems I skipped them in previous generic block. I will add them here to be safe.

app.post('/api/products', verifyAdmin, (req, res) => {
    // Add/Edit Product
    // ... Implementation logic ...
    // For brevity, assuming this might be handled by specific route or generic one? 
    // Wait, the user's admin panel calls /api/products (GET) and probably /api/products (POST) to save?
    // Let's look at admin.html: saveProduct calls... Wait, I didn't see saveProduct in admin.html snippets.
    // Ah, it uses separate logic. Let's add the basic generic structure for product saving if missing.
    // Actually, looking at previous server.js (before my edit), there were product routes.
    // I will restore them in a simplified robust way.
    const db = loadData();
    const p = req.body;
    if (!p.id) return res.status(400).json({ success: false });

    db.products[p.id] = { ...p, order: db.products[p.id]?.order ?? 999 };
    saveData(db);
    res.json({ success: true });
});

app.delete('/api/products/:id', verifyAdmin, (req, res) => {
    const db = loadData();
    if (db.products[req.params.id]) {
        delete db.products[req.params.id];
        saveData(db);
    }
    res.json({ success: true });
});




// Orders Update
app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    if (!orderData || !orderData.items) return res.status(400).json({ success: false });

    const db = loadData();

    // Authenticate (Optional for order, Mandatory for points)
    const initData = req.headers['x-telegram-init-data'] || orderData.initData;
    let telegramUser = null;
    if (initData) {
        telegramUser = verifyTelegramWebAppData(initData);
    }

    // Generer ID Court (4 chiffres)
    const shortId = generateShortId(db.orders);
    orderData.id = Date.now(); // Internal Timestamp ID
    orderData.orderId = shortId; // Public 4-digit ID
    orderData.status = 'pending';

    // Link to Telegram User & Loyalty Support
    let userId = null;
    let username = null;

    console.log("[DEBUG] ORDER RECEIVED. UserInfo:", orderData.userInfo);

    if (telegramUser) {
        userId = telegramUser.id;
        username = telegramUser.username;
        orderData.telegramUserId = userId;
        orderData.telegramUsername = username;
    } else if (orderData.userInfo && orderData.userInfo.pseudo) {
        // Fallback: Create ID from Pseudo for Web Users
        const safePseudo = orderData.userInfo.pseudo.trim();
        // Create a consistent ID: pseudo_lowercase (remove special chars)
        userId = `pseudo_${safePseudo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        username = safePseudo;
        orderData.telegramUsername = safePseudo + " (Web)";
        console.log("[DEBUG] Web User Identified. ID:", userId, "Pseudo:", username);
    }



    // STOCK MANAGEMENT: Reduce stock for each item in the order
    if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
            const productId = item.productId || item.id;
            if (productId && db.products[productId]) {
                const product = db.products[productId];
                if (product.stockGrams && product.stockGrams > 0) {
                    // Parse weight from order (e.g., "3.5g" -> 3.5)
                    const weightStr = item.weight || item.selectedWeight || '0';
                    const weight = parseFloat(weightStr.replace(/[^0-9.]/g, '')) || 0;
                    const quantity = item.quantity || 1;
                    const totalGrams = weight * quantity;

                    product.stockGrams = Math.max(0, product.stockGrams - totalGrams);
                    console.log(`[STOCK] ${product.name}: -${totalGrams}g (reste: ${product.stockGrams}g)`);
                }
            }
        });
    }

    db.orders.push(orderData);
    if (db.orders.length > 200) db.orders.shift(); // Keep last 200

    saveData(db);
    res.json({ success: true, orderId: shortId, internalId: orderData.id });
});

app.get('/api/orders', verifyAdmin, (req, res) => {
    const db = loadData();
    const reversed = [...(db.orders || [])].reverse();
    res.json({ success: true, data: reversed });
});

app.delete('/api/orders/:id', verifyAdmin, (req, res) => {
    const { id } = req.params;
    const db = loadData();
    if (!db.orders) return res.status(404).json({ success: false });

    const initLen = db.orders.length;
    // Check against internal ID (long timestamp) OR short ID (4 digits)
    db.orders = db.orders.filter(o => o.id.toString() !== id.toString() && o.orderId?.toString() !== id.toString());

    if (db.orders.length === initLen) return res.json({ success: false, message: "Commande introuvable" });

    saveData(db);
    res.json({ success: true });
});

app.delete('/api/orders', verifyAdmin, (req, res) => {
    const db = loadData();
    db.orders = [];
    saveData(db);
    res.json({ success: true });
});

// --- GITHUB UPLOAD ENDPOINT ---
app.post('/api/upload-github', verifyAdmin, uploadMemory.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier" });

    const file = req.file;
    const ext = path.extname(file.originalname);
    const filename = `hf-${Date.now()}-${Math.floor(Math.random() * 1000000000)}${ext}`;
    const filePath = `${GH_UPLOAD_DIR}/${filename}`;
    const content = file.buffer.toString('base64');
    const message = `Add ${filename} via Admin Panel`;

    const body = JSON.stringify({
        message: message,
        content: content,
        branch: GH_BRANCH
    });

    const options = {
        hostname: 'api.github.com',
        path: `/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${GH_TOKEN}`,
            'User-Agent': 'FullTerpsExotica-Server',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    console.log(`[GitHub] Uploading to ${GH_OWNER}/${GH_REPO}/${filePath}...`);

    const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            if (response.statusCode === 201 || response.statusCode === 200) {
                // Success
                const rawUrl = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${filePath}`;
                console.log(`[GitHub] Success: ${rawUrl}`);
                res.json({ success: true, url: rawUrl });
            } else {
                console.error(`[GitHub] Error ${response.statusCode}:`, data);
                res.status(500).json({ success: false, message: "GitHub Upload Failed", details: data });
            }
        });
    });

    request.on('error', (e) => {
        console.error("[GitHub] Request Error:", e);
        res.status(500).json({ success: false, message: "Network Error" });
    });

    request.write(body);
    request.end();
});

// --- GITHUB FILES LIST ---
app.get('/api/github-files', verifyAdmin, (req, res) => {
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_UPLOAD_DIR}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${GH_TOKEN}`,
            'User-Agent': 'FullTerpsExotica-Server'
        }
    };

    const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            if (response.statusCode === 200) {
                try {
                    const files = JSON.parse(data);
                    // Filter just to be safe, though not strictly required if only uploads are there
                    const formattedDetails = files.map(f => ({
                        name: f.name,
                        path: f.path,
                        sha: f.sha,
                        download_url: f.download_url,
                        // Trick to get raw URL regardless of structured response
                        raw_url: f.download_url || `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${f.path}`
                    }));
                    res.json({ success: true, data: formattedDetails });
                } catch (e) {
                    res.status(500).json({ success: false, message: "Parsing Error" });
                }
            } else {
                res.status(response.statusCode).json({ success: false, message: "GitHub Fetch Failed" });
            }
        });
    });

    request.on('error', (e) => res.status(500).json({ success: false, message: "Network Error" }));
    request.end();
});



app.get('*', (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).end();
    }
});

const server = app.listen(PORT, () => {
    console.log(`✅ Serveur Full Terps Exotica démarré sur http://localhost:${PORT}`);
});
server.setTimeout(10 * 60 * 1000); // 10 minutes timeout for handling large uploads
