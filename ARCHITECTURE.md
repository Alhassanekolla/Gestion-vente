# Architecture Simple

## Choix techniques
1. Angular 18 : Dernière version, composants standalone
2. Pagination client : Simple et rapide
3. Dexie.js : Plus facile qu'IndexedDB
4. Bootstrap : Design rapide et propre

## Comment ça marche ?
- En ligne : Données depuis l'API
- Hors ligne : Données depuis le cache
- Sync : Automatique quand on revient en ligne

## Structure
- `core/` : Services partagés
- `features/` : Pages (produits, panier, sync)
- `shared/` : Composants réutilisables

## Appris
- RxJS pour la gestion d'état
- Stockage offline avec IndexedDB
- Synchronisation données
