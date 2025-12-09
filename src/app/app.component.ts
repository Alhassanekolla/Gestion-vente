import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CartStateService } from './features/cart/services/cart-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private cartStateService = inject(CartStateService)
  isOnline = navigator.onLine;
  cartCount$ = this.cartStateService.cartCount$;


  ngOnInit(): void {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  updateOnlineStatus(): void {
    this.isOnline = navigator.onLine;
  }
}
