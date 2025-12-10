import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';
import { Product } from '../../models/product.model';
import { CartItem, PendingSyncAction } from '../../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineManagerService {

  private online$ = new BehaviorSubject<boolean>(navigator.onLine);
  onlineStatus$ = this.online$.asObservable();

  constructor(private db: OfflineStorageService) {
    window.addEventListener('online', () => this.online$.next(true));
    window.addEventListener('offline', () => this.online$.next(false));
  }

  // PRODUITS
  cacheProducts(products: Product[]) {
    return this.db.setProducts(products);
  }

  getCachedProducts() {
    return this.db.getProducts();
  }

  // PANIER
  saveCart(items: CartItem[]) {
    return this.db.setCart(items);
  }

  getCachedCart() {
    return this.db.getCart();
  }

  // SYNC
  queueAction(action: Omit<PendingSyncAction, 'id' | 'retryCount'>) {
    return this.db.addSyncAction(action);
  }

  getQueue() {
    return this.db.getSyncActions();
  }

  removeFromQueue(id: number) {
    return this.db.removeSyncAction(id);
  }

  clearAll() {
    return this.db.clearAll();
  }
}
