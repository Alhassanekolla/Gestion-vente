import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';
import { Product } from '../../models/product.model';
import { CartItem, PendingSyncAction } from '../../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineManagerService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  isOnline$ = this.isOnlineSubject.asObservable();

  private syncQueueSizeSubject = new BehaviorSubject<number>(0);
  syncQueueSize$ = this.syncQueueSizeSubject.asObservable();

  constructor(private offlineStorage: OfflineStorageService) {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());

    // Initialiser la taille de la file d'attente
    this.updateSyncQueueSize();
  }

  // ============ Gestion Statut Réseau ============
  updateOnlineStatus(): void {
    const isOnline = navigator.onLine;
    this.isOnlineSubject.next(isOnline);
    console.log(`Statut réseau mis à jour: ${isOnline ? 'En ligne' : 'Hors ligne'}`);

    if (isOnline) {
      this.updateSyncQueueSize();
    }
  }

  // ============ Produits (Cache-Then-Network) ============
  getProductsWithCacheFirst(): Promise<Product[]> {
    return new Promise(async (resolve) => {
      try {
        // 1. D'abord depuis le cache offline
        const cachedProducts = await this.offlineStorage.getProducts();

        if (cachedProducts.length > 0) {
          console.log(`Retour de ${cachedProducts.length} produits depuis le cache offline`);
          resolve(cachedProducts);
        }

        // 2. En parallèle, essayer de récupérer depuis le réseau
        if (this.isOnlineSubject.value) {
          // Cette partie sera gérée par l'interceptor et l'API service
          // On retourne juste le cache pour l'instant
        }

        resolve(cachedProducts);
      } catch (error) {
        console.error('Erreur lors de la récupération des produits avec cache:', error);
        resolve([]);
      }
    });
  }

  async cacheProducts(products: Product[]): Promise<void> {
    try {
      await this.offlineStorage.saveProducts(products);
      console.log(`${products.length} produits mis en cache`);
    } catch (error) {
      console.warn('Avertissement lors de la mise en cache des produits:', error);
      // Ne pas propager l'erreur, c'est juste du cache
    }
  }

  // ============ Panier ============
  async saveCartToOffline(items: CartItem[]): Promise<void> {
    try {
      await this.offlineStorage.saveCartItems(items);
      console.log('Panier sauvegardé offline');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier offline:', error);
    }
  }

  async getCartFromOffline(): Promise<CartItem[]> {
    try {
      return await this.offlineStorage.getCartItems();
    } catch (error) {
      console.error('Erreur lors de la récupération du panier offline:', error);
      return [];
    }
  }

  // ============ Synchronisation ============
  async addToSyncQueue(action: Omit<PendingSyncAction, 'id' | 'retryCount'>): Promise<number> {
    try {
      const id = await this.offlineStorage.addPendingSyncAction({
        ...action,
        retryCount: 0
      });

      await this.updateSyncQueueSize();
      return id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la file de sync:', error);
      throw error;
    }
  }

  async getSyncQueue(): Promise<PendingSyncAction[]> {
    try {
      return await this.offlineStorage.getPendingSyncActions();
    } catch (error) {
      console.error('Erreur lors de la récupération de la file de sync:', error);
      return [];
    }
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    try {
      await this.offlineStorage.removePendingSyncAction(id);
      await this.updateSyncQueueSize();
    } catch (error) {
      console.error('Erreur lors de la suppression de la file de sync:', error);
      throw error;
    }
  }

  async updateSyncRetry(id: number, retryCount: number): Promise<void> {
    try {
      await this.offlineStorage.updatePendingSyncActionRetry(id, retryCount);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du retry:', error);
      throw error;
    }
  }

  async clearSyncQueue(): Promise<void> {
    try {
      await this.offlineStorage.clearPendingSyncActions();
      await this.updateSyncQueueSize();
    } catch (error) {
      console.error('Erreur lors du vidage de la file de sync:', error);
      throw error;
    }
  }

  // ============ Méthodes Utilitaires ============
  private async updateSyncQueueSize(): Promise<void> {
    try {
      const actions = await this.offlineStorage.getPendingSyncActions();
      this.syncQueueSizeSubject.next(actions.length);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la taille de la file:', error);
      this.syncQueueSizeSubject.next(0);
    }
  }

  async getDatabaseInfo(): Promise<{
    products: number;
    cartItems: number;
    pendingActions: number;
    isOnline: boolean;
  }> {
    const sizes = await this.offlineStorage.getDatabaseSize();

    return {
      ...sizes,
      isOnline: this.isOnlineSubject.value
    };
  }

  async clearAllOfflineData(): Promise<void> {
    try {
      await this.offlineStorage.clearAllData();
      this.syncQueueSizeSubject.next(0);
      console.log('Toutes les données offline effacées');
    } catch (error) {
      console.error('Erreur lors du vidage des données:', error);
      throw error;
    }
  }
}
