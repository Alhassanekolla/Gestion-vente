import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductStateService } from '../../products/services/product-state.service';
import { CartApiService } from '../../../core/services/api/cart-api.service';
import { OfflineManagerService } from '../../../core/services/offline/offline-manager.service';
import { CartItem, OptimizedCartItem } from '../../../core/models/cart-item.model';
import { Product } from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private productService = inject(ProductStateService);
  private cartApi = inject(CartApiService);
  private offline = inject(OfflineManagerService);

  cartItems$ = this.cartItems.asObservable();

  constructor() {
    this.loadCart();

    this.cartItems$.subscribe(items => {
      this.offline.saveCart(items);
    });
  }

  
  addItem(product: Product, qty: number = 1) {
    const items = [...this.cartItems.value];
    const existing = items.find(item => item.productId === product.id);

    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        productId: product.id,
        quantity: qty,
        product: {
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        }
      });
    }

    this.cartItems.next(this.mergeDuplicates(items));
  }

  updateQty(productId: number, qty: number) {
    if (qty <= 0) {
      this.removeItem(productId);
      return;
    }

    const items = this.cartItems.value.map(item =>
      item.productId === productId ? { ...item, quantity: qty } : item
    );

    this.cartItems.next(items);
  }

  removeItem(productId: number) {
    const items = this.cartItems.value.filter(item => item.productId !== productId);
    this.cartItems.next(items);
  }

  clearCart() {
    this.cartItems.next([]);

    if (navigator.onLine) {
      this.cartApi.clearCart().subscribe({
        error: (err) => console.log('Erreur clear cart API:', err)
      });
    }
  }

  getCartCount() {
    return this.cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartTotal() {
    return this.cartItems.value.reduce((total, item) => {
      const product = this.productService.getProductById(item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }

  getCartWithDetails() {
    return this.cartItems.value.map(item => ({
      ...item,
      productDetails: this.productService.getProductById(item.productId)
    }));
  }

  mergeDuplicates(items: CartItem[]): CartItem[] {
    const map = new Map<number, CartItem>();

    items.forEach(item => {
      const existing = map.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        map.set(item.productId, { ...item });
      }
    });

    return Array.from(map.values());
  }

  optimizeItems(items: OptimizedCartItem[]): OptimizedCartItem[] {
    const map = new Map<number, OptimizedCartItem>();

    items.forEach(item => {
      const existing = map.get(item.id);
      if (existing) {
        existing.qty += item.qty;
      } else {
        map.set(item.id, { ...item });
      }
    });

    const result = Array.from(map.values());
    result.sort((a, b) => a.id - b.id);
    return result;
  }


  private async loadCart() {
    try {
      const cached = await this.offline.getCachedCart();
      if (cached.length > 0) {
        this.cartItems.next(cached);
      }
    if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.log('Erreur load cart:', error);
    }
  }

  private syncWithServer() {
    if (!navigator.onLine) return;

    this.cartApi.getCart().subscribe({
      next: (serverItems) => {
        if (serverItems.length > 0) {
          const local = this.cartItems.value;
          const merged = this.mergeCarts(local, serverItems);
          this.cartItems.next(merged);
        }
      },
      error: (err) => {
        console.log('Erreur sync server:', err);
      }
    });
  }

  private mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
    const merged = [...server];

    local.forEach(localItem => {
      const exists = merged.some(s => s.productId === localItem.productId);
      if (!exists) {
        merged.push(localItem);
      }
    });

    return merged;
  }

  getCurrentCart(): CartItem[] {
    return this.cartItems.value;
  }

  updateFromSync(items: CartItem[]) {
    this.cartItems.next(items);
    this.offline.saveCart(items);
  }
}
