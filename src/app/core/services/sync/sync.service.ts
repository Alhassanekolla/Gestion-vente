import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartApiService } from '../api/cart-api.service';
import { OfflineManagerService } from '../offline/offline-manager.service';
import { CartStateService } from '../../../features/cart/services/cart-state.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private syncing = new BehaviorSubject<boolean>(false);
  isSyncing$ = this.syncing.asObservable();

  constructor(
    private cartApi: CartApiService,
    private offline: OfflineManagerService,
    private cartState: CartStateService
  ) {
    window.addEventListener('online', () => {
      this.sync();
    });
  }

  async sync() {
    if (!navigator.onLine || this.syncing.value) {
      return;
    }

    this.syncing.next(true);

    try {
      await this.syncQueue();
      await this.syncCart();
    } catch (error) {
      console.log('Erreur sync:', error);
    } finally {
      this.syncing.next(false);
    }
  }

  async syncQueue() {
    const queue = await this.offline.getQueue();

    if (queue.length === 0) return;

    for (const action of queue) {
      try {
        if (action.type === 'CLEAR_CART') {
          await this.cartApi.clearCart().toPromise();
        } else {
          await this.cartApi.updateCart(this.cartState.getCurrentCart()).toPromise();
        }

        if (action.id) {
          await this.offline.removeFromQueue(action.id);
        }
      } catch (error) {
        console.log('Action echouee:', action.type);
        break;
      }
    }
  }

  async syncCart() {
    try {
      const local = this.cartState.getCurrentCart();
      const server = await this.cartApi.getCart().toPromise() || [];

      const merged = this.mergeCarts(local, server);

      this.cartState.updateFromSync(merged);
      await this.cartApi.updateCart(merged).toPromise();
    } catch (error) {
      console.log('Erreur sync cart:', error);
    }
  }

  private mergeCarts(local: any[], server: any[]) {
    const result = [...server];

    local.forEach(item => {
      const existing = result.find(i => i.productId === item.productId);
      if (!existing) {
        result.push(item);
      }
    });

    return result;
  }
}
