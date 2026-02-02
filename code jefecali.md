# 💻 Code JefeCali : Dissection Complète

Ce document contient l'intégralité des briques techniques du projet. Chaque section est conçue pour être liée depuis la documentation principale.

---

# 🖥️ 1. Backend (`server.js`)

## S1. Configuration & Sécurité
Mise en place du serveur Express, headers de sécurité et CORS.

```javascript
// server.js (Lignes 1-43)
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Sécurité : Headers HTTP stricts
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});

// CORS : Liste blanche des domaines autorisés
const allowedOrigins = ['https://hashfiltered420.cloud', 'http://localhost:3000', ...];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Autorise les apps mobiles/curl
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
```

## S2. Base de Données JSON (Custom DB)
Système "maison" pour lire/écrire dans les fichiers JSON sans base de données SQL.

### Fonction `loadData()`
```javascript
// server.js (Lignes 147-195)
function loadData() {
    let data = { admin: {}, settings: {}, products: {}, orders: [], users: {} };
    
    // Chargement défensif (try-catch) pour éviter les crash si fichier corrompu
    if (fs.existsSync(DATA_FILE)) {
        try {
            const loaded = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            data = { ...data, ...loaded };
        } catch (e) { console.error("ERREUR DATA.JSON", e); }
    }
    // ... chargement similar pour orders.json et users.json
    
    return data;
}
```

### Fonction `saveData()`
```javascript
// server.js (Lignes 197-214)
function saveData(data) {
    // Séparation des données dans 3 fichiers distincts pour performance
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(data.orders, null, 2));
        fs.writeFileSync(USERS_FILE, JSON.stringify(data.users, null, 2));
        
        // Sauvegarde du reste (Produits, Settings) dans data.json
        const coreData = { ...data };
        delete coreData.orders;
        delete coreData.users;
        fs.writeFileSync(DATA_FILE, JSON.stringify(coreData, null, 2));
    } catch (e) { console.error("ERREUR ECRITURE", e); }
}
```

## S3. Système d'Authentification

### Middleware Admin (`verifyAdmin`)
Protège les routes sensibles (`/api/products` POST, `/api/orders` GET...).

```javascript
// server.js (Lignes 217-235)
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization']; // Le mdp est envoyé dans le header
    const db = loadData();
    
    // Vérification via BCrypt (Hash sécurisé)
    if (db.admin && db.admin.passwordHash) {
        if (bcrypt.compareSync(token, db.admin.passwordHash)) {
            next(); // OK -> Passe à la fonction suivante
        } else {
            res.status(403).json({ message: "Invalid token" });
        }
    }
};
```

### Vérification Telegram (`verifyTelegramWebAppData`)
Assure que la requête vient bien de Telegram et pas d'un hacker.

```javascript
// server.js (Lignes 107-129)
function verifyTelegramWebAppData(telegramInitData) {
    // 1. Recréer la chaîne de signature
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // 2. Trier les clés alphabétiquement (Requis par Telegram)
    const params = Array.from(urlParams.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    // 3. Calculer le HMAC-SHA256 avec le BOT_TOKEN
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const dataCheck = crypto.createHmac('sha256', secretKey).update(params).digest('hex');

    // 4. Comparer
    if (dataCheck === hash) {
        return JSON.parse(urlParams.get('user')); // Retourne l'objet User valide
    }
    return null;
}
```

## S4. Gestion des Commandes (`POST /api/orders`)
Cœur du business : réception et validation d'une commande.

```javascript
// server.js (Lignes 378-413)
app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    const db = loadData();

    // ID Court pour le client (ex: 8841)
    const shortId = generateShortId(db.orders);
    
    // Liaison Telegram & Fidélité
    const initData = req.headers['x-telegram-init-data'];
    if (initData) {
        const user = verifyTelegramWebAppData(initData);
        if (user) {
            // Mise à jour Fidélité (+1 Point)
            if (!db.users[user.id]) db.users[user.id] = { points: 0 };
            db.users[user.id].points += 1;
            
            // Attacher l'ID Telegram à la commande
            orderData.telegramUserId = user.id;
        }
    }

    db.orders.push(orderData);
    saveData(db);
    res.json({ success: true, orderId: shortId });
});
```

---

# 🌐 2. Frontend (`index.html`)

## F1. Structure Bento Grid (HTML/CSS)
Le design responsive en grille.

```html
<!-- index.html (Lignes 697-728) -->
<div class="grid grid-cols-2 gap-3 pt-6">
    <!-- HERO CARD 3D (Prend 2 colonnes) -->
    <div class="bento-card hero-card col-span-2 h-64">
        <!-- Canvas 3D Three.js ici -->
    </div>

    <!-- BANNIÈRE PROMO (Prend 2 colonnes) -->
    <div class="bento-card glass-transparent-red col-span-2">
        <div class="marquee-container">...</div>
    </div>
    
    <!-- LISTE DES PRODUITS (Injectée par JS) -->
    <div id="product-grid" class="... grid grid-cols-2 gap-3"></div>
</div>
```

## F2. Logique du Panier (JavaScript)
Gestion locale du panier avant envoi.

```javascript
// index.html (Script interne)
let cart = [];

function addToCart(product, variety) {
    // Vérifier si déjà dans le panier (même ID + même variété)
    const existing = cart.find(i => i.id === product.id && i.variety === variety);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            variety: variety,
            quantity: 1
        });
    }
    updateCartIcon(); // Met à jour le badge rouge
    saveCart();       // Persistance localStorage
}
```

## F3. Modal Produit "Sheet"
L'animation et l'affichage des détails.

```javascript
// index.html (Fonctions toggleSheet)
function openProductModal(product) {
    // 1. Remplir les données
    $('#product-name').innerText = product.name;
    $('#product-description').innerText = product.description;
    
    // 2. Afficher l'overlay
    $('#product-page').classList.add('active'); // CSS transform
    
    // 3. Reset du "Sheet" (panneau bas)
    $('#product-content-sheet').classList.remove('collapsed');
}

// CSS associé (Lignes 515-522)
// #product-content-sheet.collapsed {
//     transform: translateY(calc(100% - 160px));
// }
```

---

# 🛡️ 3. Admin Panel (`admin.html`)

## A1. Login Admin
Authentification sans session serveur (Stateless simple).

```javascript
// admin.html (Lignes 600-613)
$('#login-btn').addEventListener('click', async () => {
    const pwd = $('#login-password').value;
    
    // Envoi du mot de passe brut (Simple mais fonctionnel pour ce scope)
    const res = await fetch('/api/login', { 
        body: JSON.stringify({ password: pwd }) 
    });
    
    if (data.success) {
        adminToken = pwd; // On garde le MDP en mémoire comme token
        initAdmin();      // Chargement du dashboard
    }
});
```

## A2. Gestion des Produits (CRUD)
Ajout dynamique de produits via l'interface.

```javascript
// admin.html (Extrait logique Save)
async function saveProduct() {
    const product = {
        name: $('#modal-name').value,
        category: $('#modal-category').value,
        prices: getPricesFromUI(), // Récupère la liste des prix dynamiques
        images: getImagesFromUI()  // Récupère les URLs
    };

    await fetch('/api/products', {
        method: 'POST',
        headers: { 'Authorization': adminToken }, // Auth Headers
        body: JSON.stringify(product)
    });
    
    loadProducts(); // Rafraîchir la grille
}
```
