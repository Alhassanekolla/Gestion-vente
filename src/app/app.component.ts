import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CartStateService } from './features/cart/services/cart-state.service';
import { OfflineManagerService } from './core/services/offline/offline-manager.service';
import { SyncStatusComponent } from './shared/components/sync-status/sync-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, SyncStatusComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private cartService = inject(CartStateService);
  private offline = inject(OfflineManagerService);

  isOnline = true;
  cartCount = 0;
  pendingActions = 0;

  ngOnInit() {
    this.checkNetworkStatus();

    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Vérifier le panier
    this.cartService.cartItems$.subscribe(items => {
      this.cartCount = this.cartService.getCartCount();
    });

    // Vérifier les actions en attente
    this.checkPendingActions();

    // Vérifier périodiquement
    setInterval(() => {
      this.checkPendingActions();
    }, 5000);
  }

  async checkPendingActions() {
    try {
      const queue = await this.offline.getQueue();
      this.pendingActions = queue.length;
    } catch (error) {
      console.log('Erreur check pending:', error);
    }
  }

  checkNetworkStatus() {
    this.isOnline = navigator.onLine;
  }
}
