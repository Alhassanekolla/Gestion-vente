import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, startWith } from 'rxjs';
import { ProductStateService } from '../../products/services/product-state.service';
import { CartApiService } from '../../../core/services/api/cart-api.service';
import { OfflineStorageService } from '../../../core/services/offline/offline-storage.service';
import { CartItem, OptimizedCartItem } from '../../../core/models/cart-item.model';
import { Product } from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  public cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private productStateService = inject(ProductStateService);
  private offlineStorage = inject(OfflineStorageService);
  private cartApiService = inject(CartApiService);

  // Observables publics
  cartItems$ = this.cartItemsSubject.asObservable();
  cartCount$ = this.cartItems$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  );

  cartTotal$ = this.cartItems$.pipe(
    map(items => this.calculateTotal(items))
  );

  constructor() {
    // Charger depuis IndexedDB au démarrage
    this.loadFromStorage();

    // Synchroniser avec l'API si en ligne
    if (navigator.onLine) {
      this.syncWithServer();
    }

    // Sauvegarder dans IndexedDB à chaque modification
    this.cartItems$.subscribe(items => {
      this.saveToStorage(items);
    });
  }

  // ========== MÉTHODES PUBLIQUES ==========

  addItem(product: Product, quantity: number = 1): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);

    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      // Mettre à jour la quantité de l'item existant
      updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
    } else {
      // Ajouter un nouvel item (sans id)
      const newItem: CartItem = {
        productId: product.id,
        quantity,
        product: {
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        }
        // Pas de id ici, il sera ajouté par Dexie si nécessaire
      };
      updatedItems = [...currentItems, newItem];
    }

    // Optimiser le panier avant de sauvegarder
    const optimizedItems = this.optimizeCart(updatedItems);
    this.cartItemsSubject.next(optimizedItems);
  }

  getCartItemsWithDetails(): Observable<(CartItem & { productDetails?: Product })[]> {
    return this.cartItems$.pipe(
      map(items => {
        return items.map(item => {
          const product = this.productStateService.getProductById(item.productId);
          return {
            ...item,
            productDetails: product
          };
        });
      }),
      // Ajouter un default value pour éviter undefined
      startWith([])
    );
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const currentItems = this.cartItemsSubject.value;
    const updatedItems = currentItems.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    );

    this.cartItemsSubject.next(updatedItems);
  }

  removeItem(productId: number): void {
    const currentItems = this.cartItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.productId !== productId);
    this.cartItemsSubject.next(updatedItems);
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    // Nettoyer aussi l'API si en ligne
    if (navigator.onLine) {
      this.cartApiService.clearCart().subscribe({
        error: (error) => console.error('Erreur lors du vidage du panier serveur:', error)
      });
    }
  }

  syncWithServer(): void {
    this.cartApiService.getCart().subscribe({
      next: (serverItems) => {
        const localItems = this.cartItemsSubject.value;

        // Fusionner les paniers (privilégier le serveur en cas de conflit)
        if (serverItems.length > 0) {
          // Utiliser l'algorithme d'optimisation pour fusionner
          const merged = this.mergeCarts(localItems, serverItems);
          this.cartItemsSubject.next(merged);
        }
      },
      error: (error) => {
        console.log('Impossible de synchroniser avec le serveur:', error);
        // Continuer avec les données locales
      }
    });
  }

  // ========== FONCTIONS ALGORITHMIQUES ==========

  optimizeCart(items: CartItem[]): CartItem[] {
    if (items.length === 0) return [];

    const itemMap = new Map<number, CartItem>();

    for (const item of items) {
      const existing = itemMap.get(item.productId);

      if (existing) {
        // Fusionner les quantités
        existing.quantity += item.quantity;
      } else {
        // Nouvel item
        itemMap.set(item.productId, { ...item });
      }
    }

    return Array.from(itemMap.values());
  }

  optimizeCartExercise(items: OptimizedCartItem[]): OptimizedCartItem[] {
    if (items.length === 0) return [];

    const itemMap = new Map<number, OptimizedCartItem>();

    for (const item of items) {
      const existing = itemMap.get(item.id);

      if (existing) {
        existing.qty += item.qty;
      } else {
        itemMap.set(item.id, { ...item });
      }
    }

    return Array.from(itemMap.values()).sort((a, b) => a.id - b.id);
  }

  private mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
    // Fusionner les deux listes
    const mergedMap = new Map<number, CartItem>();

    // Ajouter les items du serveur
    server.forEach(item => {
      mergedMap.set(item.productId, { ...item });
    });

    // Ajouter/combiner avec les items locaux
    local.forEach(item => {
      const existing = mergedMap.get(item.productId);
      if (existing) {
        // Prendre la plus grande quantité (stratégie de résolution de conflit)
        existing.quantity = Math.max(existing.quantity, item.quantity);
      } else {
        mergedMap.set(item.productId, { ...item });
      }
    });

    return Array.from(mergedMap.values());
  }

  // ========== MÉTHODES PRIVÉES ==========

  private loadFromStorage(): void {
    this.offlineStorage.getCartItems().then(items => {
      if (items.length > 0) {
        this.cartItemsSubject.next(items);
      }
    }).catch(error => {
      console.error('Erreur lors du chargement du panier:', error);
    });
  }

  private saveToStorage(items: CartItem[]): void {
    this.offlineStorage.saveCartItems(items).catch(error => {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    });
  }

  private calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      const product = this.productStateService.getProductById(item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }
}
