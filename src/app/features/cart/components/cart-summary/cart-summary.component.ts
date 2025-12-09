import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">
          <i class="bi bi-receipt me-2"></i>Résumé du panier
        </h5>
      </div>

      <div class="card-body">
        <!-- Sous-total -->
        <div class="d-flex justify-content-between mb-2">
          <span>Sous-total</span>
          <span>{{ subtotal | currency:'EUR':'symbol':'1.2-2' }}</span>
        </div>

        <!-- Frais de port -->
        <div class="d-flex justify-content-between mb-2">
          <span>Frais de port</span>
          <span>{{ shipping | currency:'EUR':'symbol':'1.2-2' }}</span>
        </div>

        <!-- Réduction -->
        <div class="d-flex justify-content-between mb-3" *ngIf="discount > 0">
          <span>Réduction</span>
          <span class="text-success">-{{ discount | currency:'EUR':'symbol':'1.2-2' }}</span>
        </div>

        <hr>

        <!-- Total -->
        <div class="d-flex justify-content-between mb-4">
          <strong>Total</strong>
          <strong class="h5 text-primary">{{ total | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </div>

        <!-- Bouton Commander -->
        <button
          class="btn btn-primary w-100 btn-lg mb-3"
          (click)="checkout.emit()"
          [disabled]="itemCount === 0"
        >
          <i class="bi bi-bag-check me-2"></i>Passer commande
        </button>

        <!-- Bouton Vider -->
        <button
          class="btn btn-outline-danger w-100"
          (click)="clearCart.emit()"
          [disabled]="itemCount === 0"
        >
          <i class="bi bi-trash me-2"></i>Vider le panier
        </button>

        <!-- Message panier vide -->
        <div *ngIf="itemCount === 0" class="alert alert-info mt-3 mb-0">
          <i class="bi bi-info-circle me-2"></i>Votre panier est vide
        </div>
      </div>

      <div class="card-footer text-muted small">
        <div class="d-flex justify-content-between">
          <span>{{ itemCount }} article(s)</span>
          <span>{{ totalItems }} unité(s)</span>
        </div>
      </div>
    </div>
  `
})
export class CartSummaryComponent {
  @Input() subtotal = 0;
  @Input() shipping = 4.99;
  @Input() discount = 0;
  @Input() itemCount = 0;
  @Input() totalItems = 0;

  @Output() checkout = new EventEmitter<void>();
  @Output() clearCart = new EventEmitter<void>();

  get total(): number {
    return Math.max(0, this.subtotal + this.shipping - this.discount);
  }
}
