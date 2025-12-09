import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, startWith } from 'rxjs';
import { ProductStateService } from '../../products/services/product-state.service';
import { CartItem, OptimizedCartItem } from '../../../core/models/cart-item.model';
import { Product } from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  public cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private productStateService = inject(ProductStateService);

  // Observables publics
  cartItems$ = this.cartItemsSubject.asObservable();
  cartCount$ = this.cartItems$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  );

  cartTotal$ = this.cartItems$.pipe(
  map(items => this.calculateTotal(items)),
  startWith(0) // ← Ajouter cette ligne
);
  constructor() {
    // Charger le panier depuis le localStorage au démarrage (temporaire)
    this.loadFromLocalStorage();

    // Sauvegarder dans localStorage à chaque modification
    this.cartItems$.subscribe(items => {
      this.saveToLocalStorage(items);
    });
  }

  // Méthodes publiques
  addItem(product: Product, quantity: number = 1): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      // Mettre à jour la quantité de l'item existant
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      this.cartItemsSubject.next(updatedItems);
    } else {
      // Ajouter un nouvel item
      const newItem: CartItem = {
        productId: product.id,
        quantity,
        product: {
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        }
      };
      this.cartItemsSubject.next([...currentItems, newItem]);
    }
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

  isProductInCart(productId: number): Observable<boolean> {
    return this.cartItems$.pipe(
      map(items => items.some(item => item.productId === productId))
    );
  }

  // Fonction algorithmique d'optimisation du panier
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

    // Convertir la Map en tableau
    return Array.from(itemMap.values());
  }

  // Version avec l'interface OptimizedCartItem (pour l'exercice)
  optimizeCartExercise(items: OptimizedCartItem[]): OptimizedCartItem[] {
    if (items.length === 0) return [];

    const itemMap = new Map<number, OptimizedCartItem>();

    for (const item of items) {
      const existing = itemMap.get(item.id);

      if (existing) {
        // Fusionner les quantités
        existing.qty += item.qty;
      } else {
        // Nouvel item
        itemMap.set(item.id, { ...item });
      }
    }

    // Convertir la Map en tableau trié par id
    return Array.from(itemMap.values()).sort((a, b) => a.id - b.id);
  }

  // Méthodes privées
  private calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      const product = this.productStateService.getProductById(item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('mini-dashboard-cart');
      if (saved) {
        const items = JSON.parse(saved);
        this.cartItemsSubject.next(items);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    }
  }

  private saveToLocalStorage(items: CartItem[]): void {
    try {
      localStorage.setItem('mini-dashboard-cart', JSON.stringify(items));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }
}
