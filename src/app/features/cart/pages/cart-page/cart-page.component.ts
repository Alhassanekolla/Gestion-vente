import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartStateService } from '../../services/cart-state.service';
import { CartItemComponent } from '../../components/cart-item/cart-item.component';
import { CartSummaryComponent } from '../../components/cart-summary/cart-summary.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CartItemComponent,
    CartSummaryComponent
  ],
  template: `
    <div class="container mt-4">
      <h1 class="mb-4">
        <i class="bi bi-cart me-2"></i>Mon Panier
      </h1>

      <div class="row">
        <!-- Liste articles -->
        <div class="col-lg-8">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Articles ({{ cartCount }})</h3>
            <button class="btn btn-sm btn-outline-primary" (click)="testOptimize()">
              <i class="bi bi-gear me-1"></i>Tester optimisation
            </button>
          </div>

          <!-- Panier vide -->
          <div *ngIf="cartItems.length === 0" class="text-center py-5 border rounded">
            <i class="bi bi-cart-x display-4 text-muted mb-3"></i>
            <h4>Panier vide</h4>
            <p class="mb-4">Ajoutez des produits depuis le catalogue</p>
            <a routerLink="/products" class="btn btn-primary">
              Voir catalogue
            </a>
          </div>

          <!-- Liste articles -->
          <div *ngIf="cartItems.length > 0">
            <app-cart-item
              *ngFor="let item of cartItemsWithDetails"
              [item]="item"
              (quantityChange)="updateQty($event)"
              (remove)="removeItem($event)"
            ></app-cart-item>
          </div>
        </div>

        <!-- Résumé -->
        <div class="col-lg-4">
          <app-cart-summary
            [subtotal]="cartTotal"
            [itemCount]="cartItems.length"
            [totalItems]="cartCount"
            (checkout)="checkout()"
            (clearCart)="clearCart()"
          ></app-cart-summary>

          <!-- Démo algorithmique -->
          <div class="card mt-4">
            <div class="card-header bg-info text-white">
              <h6 class="mb-0">Démo algorithmique</h6>
            </div>
            <div class="card-body">
              <p class="small mb-3">
                Fusionne les articles similaires et additionne leurs quantités
              </p>

              <div *ngIf="demoResult" class="mb-3 p-2 bg-light rounded">
                <div class="small">
                  <strong>Avant :</strong> {{ demoResult.before | json }}
                </div>
                <div class="small mt-1">
                  <strong>Après :</strong> {{ demoResult.after | json }}
                </div>
              </div>

              <button class="btn btn-info btn-sm w-100" (click)="runDemo()">
                <i class="bi bi-play me-1"></i>Lancer démo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartPageComponent implements OnInit {
  private cartService = inject(CartStateService);
  cartItems: any[] = [];
  cartCount = 0;
  cartTotal = 0;

  demoResult: { before: any[], after: any[] } | null = null;

  ngOnInit() {

    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = this.cartService.getCartCount();
      this.cartTotal = this.cartService.getCartTotal();
    });
  }

  get cartItemsWithDetails() {
    return this.cartService.getCartWithDetails();
  }

  updateQty(event: { productId: number, quantity: number }) {
    this.cartService.updateQty(event.productId, event.quantity);
  }

  removeItem(productId: number) {
    this.cartService.removeItem(productId);
  }

  clearCart() {
    if (confirm('Vider le panier ?')) {
      this.cartService.clearCart();
    }
  }

  checkout() {
    alert('Commande passée! Livraison sous 48h.');
    this.cartService.clearCart();
  }

  runDemo() {
    const testData = [
      { id: 1, qty: 1 },
      { id: 2, qty: 3 },
      { id: 1, qty: 5 },
      { id: 3, qty: 2 },
      { id: 2, qty: 1 }
    ];

    const result = this.cartService.optimizeItems(testData);

    this.demoResult = {
      before: testData,
      after: result
    };
  }

  testOptimize() {
    const current = this.cartItems;

    if (current.length === 0) {
      alert('Panier vide! Ajoutez des articles.');
      return;
    }

    const testData = current.map(item => ({
      id: item.productId,
      qty: item.quantity
    }));

    const result = this.cartService.optimizeItems(testData);

    this.demoResult = {
      before: testData,
      after: result
    };

    if (testData.length > result.length) {
      alert(`${testData.length - result.length} articles fusionnés`);
    }
  }
}
