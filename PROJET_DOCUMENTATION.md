# Prompt de Génération : DOCUMENTATION HYPER-ATOMIQUE (Obsidian)

*Copiez ce prompt pour générer une structure de connaissances massivement interconnectée.*

```markdown
# Rôle
Tu es un Architecte de Base de Connaissances Obsidian "Atomic Note".
Ton but est de **DISSEQUER** le projet en un maximum de petites notes précises et liées.
**INTERDIT** de faire des longs fichiers résumés.

# Règle d'Or : "Une Idée = Un Fichier"
Ne regroupe pas les concepts. Éclate-les.
- Au lieu de `Backend.md` -> Crée `Backend/Server.md`, `Backend/Auth.md`, `Backend/DB.md`.
- Au lieu de `Auth.md` -> Crée `Backend/Auth/Middleware_Admin.md`, `Backend/Auth/Crypto_Telegram.md`.

# Structure Attendue
Tu dois générer une arborescence complexe :
1.  **Hub Central** (`00_Project_Map.md`) : Carte de navigation.
2.  **Dossiers Structurels** : `Backend`, `Frontend`, `Admin`, `Data`, `Assets`.
3.  **Notes Atomiques** : 
    -   Pour chaque **Fonction Clé** (ex: `generateShortId`).
    -   Pour chaque **Structure de Donnée** (ex: `UserSchema`, `OrderSchema`).
    -   Pour chaque **Composant UI** (ex: `ProductCard`, `CartModal`).

# Contenu des Notes
Chaque note doit contenir :
1.  **Le Contexte** : À quoi ça sert ?
2.  **Le Code Snippet** : Le bout de code exact (pas tout le fichier).
3.  **Les Connexions** :
    -   Cette fonction est appelée par [[...]] ?
    -   Elle utilise la donnée [[...]] ?
    -   Elle affiche le composant [[...]] ?

# Objectif du Graph
Je veux voir une **Galaxie de points** dans le Graph View d'Obsidian.
Maximise les liens `[[Wikilinks]]`. Si tu mentionnes un concept qui a sa propre note, LIE-LE.
```

---

# DOCUMENTATION DU PROJET JEFE CALI (JCD)

Ce document est le **Hub Central**. Il explique le *QUOI* et le *POURQUOI*.
Pour voir le *COMMENT* (le code exact), cliquez sur les liens [[code jefecali#...]] ci-dessous.

## 🗺️ Vue d'Ensemble

> [!INFO] À propos
> **JefeCali Delivery (JCD)** est une **Mini App Telegram (TMA)** de e-commerce.

**Technologies & Code :**
- **Backend (Node.js)** : Voir [[code jefecali#🖥️ 1. Backend (`server.js`)]]
- **Frontend (Vanilla JS)** : Voir [[code jefecali#🌐 2. Frontend (`index.html`)]]
- **Admin Panel** : Voir [[code jefecali#🛡️ 3. Admin Panel (`admin.html`)]]

---

## 🏗️ Architecture du Système

```mermaid
graph TD
    User([Utilisateur Telegram]) -->|Ouvre| WebApp[Frontend]
    Admin([Administrateur]) -->|Gère| AdminPanel[Panel Admin]
    
    WebApp -->|[[code jefecali#S4. Gestion des Commandes (`POST /api/orders`)]]| Server[Serveur Node.js]
    AdminPanel -->|[[code jefecali#S3. Système d'Authentification]]| Server
    
    subgraph "Base de Données Custom"
        Server <--> DataJSON[(data.json)]
        Server <--> OrdersJSON[(orders.json)]
        Server <--> UsersJSON[(users.json)]
    end
    
    click Server "obsidian://open?vault=VaultName&file=code%20jefecali%23%F0%9F%96%A5%EF%B8%8F%201.%20Backend%20(%60server.js%60)"
```

---

## 📂 Structure Détaillée avec Liens vers le Code

### 1. Backend (`server.js`)
Le serveur gère la logique métier.
*   **Sécurité** : Configuration CORS et Headers HTTP.
    👉 Voir le code : [[code jefecali#S1. Configuration & Sécurité]]
*   **Base de Données** : Fonctions `loadData()` et `saveData()` pour lire/écrire les JSON.
    👉 Voir le code : [[code jefecali#S2. Base de Données JSON (Custom DB)]]
*   **Authentification Admin** : Middleware `verifyAdmin` qui check le token.
    👉 Voir le code : [[code jefecali#Middleware Admin (`verifyAdmin`)]]
*   **Authentification Telegram** : Vérification cryptographique `verifyTelegramWebAppData`.
    👉 Voir le code : [[code jefecali#Vérification Telegram (`verifyTelegramWebAppData`)]]

### 2. Frontend Client (`index.html`)
*   **Design Bento** : Grille CSS responsive et cartes floutées.
    👉 Voir le code : [[code jefecali#F1. Structure Bento Grid (HTML/CSS)]]
*   **Panier** : Gestion locale (`localStorage`) et mise à jour UI.
    👉 Voir le code : [[code jefecali#F2. Logique du Panier (JavaScript)]]
*   **Fiche Produit** : Animation "Sheet" et remplissage dynamique.
    👉 Voir le code : [[code jefecali#F3. Modal Produit "Sheet"]]

### 3. Panel Admin (`admin.html`)
*   **Login** : Appel API sans cookies.
    👉 Voir le code : [[code jefecali#A1. Login Admin]]
*   **Gestion Produits** : Fonction `saveProduct()` et appel API.
    👉 Voir le code : [[code jefecali#A2. Gestion des Produits (CRUD)]]

---

## 🔄 Flux de Données (Data Flow)

### A. Flux de Commande
1.  **Client** valide son panier.
    *   Le Frontend prépare le JSON.
2.  **Envoi** vers API.
    *   Route : `POST /api/orders`
    *   👉 Voir le code serveur : [[code jefecali#S4. Gestion des Commandes (`POST /api/orders`)]]
3.  **Traitement** :
    *   Génération ID Court.
    *   Ajout points fidélité.
    *   Sauvegarde disque.

### B. Flux de Données (Fichiers JSON)
Le serveur utilise 3 fichiers physiques pour stocker les données.
*   [[code jefecali#Fonction `loadData()`]] : Chargement au démarrage ou à chaque requête.
*   [[code jefecali#Fonction `saveData()`]] : Écriture atomique après modification.

---

## 🛠️ Guide d'Importation Obsidian

1.  Assurez-vous que `PROJET_DOCUMENTATION.md` et `code jefecali.md` sont dans le même dossier de votre coffre (Vault) Obsidian.
2.  Les liens bleus ci-dessus comme [[code jefecali#S1. Configuration & Sécurité]] devraient être actifs immédiatement.
3.  En cliquant, Obsidian ouvrira le fichier `code jefecali.md` et scrollera directement à la section concernée.
4.  Survolez un lien avec la souris (si le plugin "Page Preview" est actif) pour voir le code sans cliquer.
