# 🛍️ Mini Dashboard - Angular Technical Test

## 📋 Description
Application e-commerce démonstrative construite avec Angular  mettant en œuvre :
- Catalogue produits avec filtres, recherche et pagination
- Panier avec optimisation algorithmique  
- Mode offline avec persistance des données
- Synchronisation automatique avec retry logic

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (version 18 ou supérieure)
- Angular CLI (version 18.2.0) : `npm install -g @angular/cli`



### 📥 Installation

# 1. Cloner le repository
git clone https://github.com/Alhassanekolla/Gestion-vente.git
cd mini-dashboard

# 2. Installer les dépendances
npm install
`

## Démarrage de l'Application

# Démarrer le serveur de mock API
npx json-server --watch db.json --port 3000

# Démarrer l'application Angular
ng serve



### 🌐 Accès aux Applications
# Application Frontend : 
    http://localhost:4200
# API Mock : 
    http://localhost:3000



### 🎯 Fonctionnalités Implémentées
## ✅ Catalogue Produits
  Affichage grid des produits
  Filtrage par catégorie et recherche texte
  Tri par prix (croissant/décroissant)
  Pagination locale

✅ Gestion du Panier
  Ajout/Modification/Suppression d'articles
  Calcul automatique du total
  Algorithme d'optimisation : regroupement articles similaires

✅ Mode Offline & Synchronisation
  Persistance des données en local (IndexedDB)
  Fonctionnement complet hors ligne
  Synchronisation manuelle et automatique
  Retry logic (3 tentatives automatiques)


# Développé avec Angular 18 • RxJS • Bootstrap • Dexie.js
