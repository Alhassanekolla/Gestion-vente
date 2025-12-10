import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Product } from '../../models/product.model';
import { CartItem, PendingSyncAction } from '../../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService extends Dexie {

  products!: Dexie.Table<Product, number>;
  cartItems!: Dexie.Table<CartItem, number>;
  syncQueue!: Dexie.Table<PendingSyncAction, number>;

  constructor() {
    super('OfflineDB');

    this.version(1).stores({
      products: '++id, category',
      cartItems: '++id, productId',
      syncQueue: '++id, type, timestamp'
    });

    this.open().catch(err => console.error('Erreur Dexie', err));
  }

  // PRODUITS
  async setProducts(items: Product[]) {
    await this.products.clear();
    if (items.length > 0) {
       for (const item of items) {
        await this.products.put(item);
      }
    }
  }

  getProducts() {
    return this.products.toArray();
  }

  // PANIER
  async setCart(items: CartItem[]) {
    await this.cartItems.clear();
    if (items.length > 0) {
       const itemsToSave = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        updatedAt: new Date()
       }));

      for (const item of itemsToSave) {
        await this.cartItems.add(item);
      }
    }
  }

  getCart() {
    return this.cartItems.toArray();
  }

  // SYNC
  addSyncAction(action: Omit<PendingSyncAction, 'id' | 'retryCount'>) {
    return this.syncQueue.add({ ...action, retryCount: 0 });
  }

  getSyncActions() {
    return this.syncQueue.orderBy('timestamp').toArray();
  }

  removeSyncAction(id: number) {
    return this.syncQueue.delete(id);
  }

  clearAll() {
    return Promise.all([
      this.products.clear(),
      this.cartItems.clear(),
      this.syncQueue.clear()
    ]);
  }
}
