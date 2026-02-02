# Documentation du Projet Big Clouds (ex-JefeCali)

Ce fichier sert de contexte et de référence pour Gemini afin de faciliter les futures modifications et la maintenance du projet.

## 1. Vue d'ensemble
Ce projet est une **Web App (PWA / Telegram Mini App)** de commande et de livraison ("Big Clouds").  
Elle permet aux utilisateurs de parcourir un catalogue de produits (Weed, Hash, Vape, etc.), de gérer un panier, et de passer commande via Telegram ou d'autres messageries.
Le projet inclut également un **Panneau d'Administration** pour gérer les produits, les commandes et la configuration.

**État actuel** : Rebranding effectué de "JefeCali" vers "**Big Clouds**".

## 2. Architecture Technique

### Frontend
*   **Technologies** : HTML5, Vanilla JavaScript, TailwindCSS (CDN), FontAwesome.
*   **Design System** : "Bento Grid", Glassmorphism (`backdrop-filter`), Thème sombre (`#050505`).
*   **Fichiers Clés** :
    *   `index.html` : L'application client principale. Contient toute la logique client (Splash screen, Catalogue, Panier, Modales, Intégration Telegram).
    *   `admin.html` : Le dashboard administrateur (protégé par mot de passe stocké dans `data.json`). Permet de modifier les produits, voir les commandes et configurer l'app.
    *   `modifieur.html` : Semble être un outil utilitaire (à vérifier).

### Backend
*   **Technologies** : Node.js, Express.js.
*   **Base de données** : Système de fichiers JSON simple (Custom JSON Engine).
*   **Fichiers Clés** :
    *   `server.js` : Le serveur API. Gère les routes `/api/products`, `/api/orders`, `/api/settings`, l'upload de fichiers, et l'authentification admin basique.
    *   `package.json` : Dépendances (`express`, `multer`, `cors`, `bcryptjs`). Nom du projet : `big-clouds-backend`.

### Stockage des Données (JSON)
*   `data.json` : Configuration globale, paramètres ("Settings"), produits, hash du mot de passe admin.
*   `orders.json` : Historique des commandes.
*   `users.json` : Données utilisateurs et fidélité.

## 3. Configuration & Personnalisation

### Rebranding (Big Clouds)
*   **Logo** : `uploads/big_clouds_logo.png` (Local) ou géré via GitHub Raw dans certains cas (anciennement).
*   **Identité** : Configurable dans `data.json` sous `appTitle` et `bannerText`.
*   **Couleurs** : Principalement définies dans le CSS de `index.html` (Variables CSS `--accent-primary` etc, souvent hardcodées en Tailwind).

### Images
*   Les images peuvent être stockées localement dans `uploads/` ou via des liens externes (souvent GitHub Raw `raw.githubusercontent.com`).
*   Le serveur possède un proxy/hacks pour gérer certains liens GitHub blobs.

## 4. Fonctionnalités Clés

1.  **Splash Screen** : Écran de chargement avec logo animé.
2.  **Navigation** : Dock flottant en bas de l'écran (Home, Fidélité, Contact, Panier).
3.  **Catalogue** : Grille de produits ("Bento Cards"). Supporte catégories dynamiques.
4.  **Fiche Produit** : "Sheet" glissant depuis le bas (style iOS) avec carrousel d'images.
5.  **Panier & Commande** :
    *   Stockage local (`localStorage`).
    *   Options : Livraison vs Envoi (Mondial Relay, Chronopost).
    *   Paiement : Crypto, PCS, PayPal, etc.
    *   Validation : Envoie la commande au serveur + Intégration Telegram WebApp si dispo.
6.  **Fidélité** : Système de points et récompenses (configurable dans l'admin).
7.  **Admin** :
    *   Ajout/Modif/Suppression Produits.
    *   Gestion Commandes (Suppression, vue détail).
    *   Stats simples.
    *   Configuration des Liens (Telegram, Instagram) et Textes.

## 5. Commandes Utiles

*   **Lancer le serveur en local** :
    ```bash
    ./start_local.bat
    # ou
    node server.js
    ```
    Le serveur tourne sur le port `3002` (par défaut). Admin sur `http://localhost:3002/admin.html`.

*   **Structure des dossiers** :
    *   `/uploads` : Stockage des fichiers uploadés via l'admin ou générés.
    *   `node_modules` : Dépendances NPM.

## 6. Notes pour l'IA (Maintenance)
*   **Attention au JSON** : La base de données est un fichier plat. En cas de crash serveur pendant une écriture, risque de corruption (rare mais possible). Toujours vérifier la structure de `data.json`.
*   **Conflits CSS** : Le projet utilise Tailwind via CDN ET du CSS custom dans `<style>`. Vérifier les classes `z-index` lors de l'ajout de modales (beaucoup d'éléments sont en `fixed`).
*   ** telegram-web-app.js** : Utilisé pour récupérer l'utilisateur Telegram. Si absent (navigateur classique), l'app fonctionne en mode dégradé (champs manuels).
*   **Liens Absolus** : L'IA doit utiliser des chemins absolus pour lister/lire les fichiers (`/run/media/tonydetony/OS/Users/simon/Desktop/jefecali modele a modifie/...`).

---
*Dernière mise à jour : Rebranding vers Big Clouds (01/02/2026).*
