import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CartStateService } from './features/cart/services/cart-state.service';
import { OfflineManagerService } from './core/services/offline/offline-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule,
    RouterOutlet,
    RouterModule,
    ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private cartStateService = inject(CartStateService)
  private offlineManager = inject(OfflineManagerService)
  isOnline = navigator.onLine;
  cartCount$ = this.cartStateService.cartCount$;
  syncQueueSize$ = this.offlineManager.syncQueueSize$;

  constructor(

  ) {}

  ngOnInit(): void {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());

    // S'abonner aux changements de statut du service offline
    this.offlineManager.isOnline$.subscribe(isOnline => {
      this.isOnline = isOnline;
    });
  }

  updateOnlineStatus(): void {
    this.offlineManager.updateOnlineStatus();
  }

  manualSync(): void {
    alert('Synchronisation manuelle - À implémenter avec le service de sync complet');
    // TODO: Appeler le service de synchronisation
  }
}
