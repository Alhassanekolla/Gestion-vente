import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Product } from '../../models/product.model';
import { CartItem, PendingSyncAction } from '../../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService extends Dexie {
  // Tables avec types corrects
  products!: Dexie.Table<Product, number>; // number = type de la clé primaire (id)
  cartItems!: Dexie.Table<CartItem, number>; // CartItem avec id optionnel
  pendingSyncActions!: Dexie.Table<PendingSyncAction, number>;

  constructor() {
    super('MiniDashboardDB');

    // Version 1 du schéma
    this.version(1).stores({
      products: '++id, category', // ++id = auto-increment
      cartItems: '++id, productId', // ++id = auto-increment pour cartItems aussi
      pendingSyncActions: '++id, type, timestamp'
    });

    // Ouvrir la base de données
    this.open()
      .then(() => console.log('Base de données Dexie ouverte avec succès'))
      .catch(err => console.error('Erreur d\'ouverture de Dexie:', err));
  }

  // ============ Méthodes Produits ============
  async saveProducts(products: Product[]): Promise<void> {
    try {
      // Nettoyer d'abord
      await this.products.clear();

      // Petite pause pour s'assurer que le clear est terminé
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ajouter les produits un par un avec put()
      for (const product of products) {
        await this.products.put(product);
      }

      console.log(`${products.length} produits sauvegardés offline`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des produits:', error);
      // Ne pas throw pour ne pas casser l'app, juste logger
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await this.products.toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return [];
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      return await this.products.get(id);
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      return undefined;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      if (!query.trim()) {
        return await this.getProducts();
      }

      const lowerQuery = query.toLowerCase();
      return await this.products
        .filter(product =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.description?.toLowerCase().includes(lowerQuery) ||
          product.category.toLowerCase().includes(lowerQuery)
        )
        .toArray();
    } catch (error) {
      console.error('Erreur lors de la recherche des produits:', error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const products = await this.getProducts();
      const categories = [...new Set(products.map(p => p.category))];
      return categories;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return [];
    }
  }

  // ============ Méthodes Panier ============
  async saveCartItems(items: CartItem[]): Promise<void> {
    try {
      await this.cartItems.clear();

      if (items.length > 0) {
        // Créer des items avec timestamp et sans l'id (Dexie le génère)
        const itemsToSave = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          product: item.product,
          updatedAt: new Date()
        }));

        // Utiliser put() au lieu de bulkAdd()
        for (const item of itemsToSave) {
          await this.cartItems.put(item);
        }
      }

      console.log(`${items.length} articles sauvegardés dans le panier offline`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
      // Ne pas throw
    }
  }

  async getCartItems(): Promise<CartItem[]> {
    try {
      return await this.cartItems.toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération du panier:', error);
      return [];
    }
  }

  async addOrUpdateCartItem(item: CartItem): Promise<void> {
    try {
      // Chercher par productId (pas par id)
      const existing = await this.cartItems
        .where('productId')
        .equals(item.productId)
        .first();

      if (existing) {
        // Mettre à jour l'item existant
        await this.cartItems.update(existing.id!, {
          quantity: item.quantity,
          updatedAt: new Date()
        });
      } else {
        // Ajouter un nouvel item
        await this.cartItems.add({
          productId: item.productId,
          quantity: item.quantity,
          product: item.product,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du panier:', error);
      throw error;
    }
  }

  async removeCartItem(productId: number): Promise<void> {
    try {
      await this.cartItems
        .where('productId')
        .equals(productId)
        .delete();
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      await this.cartItems.clear();
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error);
      throw error;
    }
  }

  // ============ Méthodes Synchronisation ============
  async addPendingSyncAction(action: Omit<PendingSyncAction, 'id'>): Promise<number> {
    try {
      return await this.pendingSyncActions.add({
        ...action,
        retryCount: 0
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'action en attente:', error);
      throw error;
    }
  }

  async getPendingSyncActions(): Promise<PendingSyncAction[]> {
    try {
      return await this.pendingSyncActions
        .orderBy('timestamp')
        .toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des actions en attente:', error);
      return [];
    }
  }

  async removePendingSyncAction(id: number): Promise<void> {
    try {
      await this.pendingSyncActions.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression d\'action en attente:', error);
      throw error;
    }
  }

  async updatePendingSyncActionRetry(id: number, retryCount: number): Promise<void> {
    try {
      await this.pendingSyncActions.update(id, {
        retryCount,
        lastAttempt: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur de retry:', error);
      throw error;
    }
  }

  async clearPendingSyncActions(): Promise<void> {
    try {
      await this.pendingSyncActions.clear();
    } catch (error) {
      console.error('Erreur lors du vidage des actions en attente:', error);
      throw error;
    }
  }

  // ============ Méthodes Utilitaires ============
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.products.clear(),
        this.cartItems.clear(),
        this.pendingSyncActions.clear()
      ]);
      console.log('Toutes les données offline ont été effacées');
    } catch (error) {
      console.error('Erreur lors du vidage des données:', error);
      // Ne pas throw
    }
  }

  async getDatabaseSize(): Promise<{ products: number; cartItems: number; pendingActions: number }> {
    try {
      const [products, cartItems, pendingActions] = await Promise.all([
        this.products.count(),
        this.cartItems.count(),
        this.pendingSyncActions.count()
      ]);

      return { products, cartItems, pendingActions };
    } catch (error) {
      console.error('Erreur lors du comptage des données:', error);
      return { products: 0, cartItems: 0, pendingActions: 0 };
    }
  }
}
