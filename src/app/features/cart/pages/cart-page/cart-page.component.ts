import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartStateService } from '../../services/cart-state.service';
import { CartItemComponent } from '../../components/cart-item/cart-item.component';
import { CartSummaryComponent } from '../../components/cart-summary/cart-summary.component';
import { OptimizedCartItem } from '../../../../core/models/cart-item.model';


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
    <div class="row mb-4">
      <div class="col-12">
        <h1 class="display-6 mb-3">
          <i class="bi bi-cart me-2"></i>Votre Panier
        </h1>
        <p class="text-muted">Gérez vos articles et passez à la caisse.</p>
      </div>
    </div>

    <div class="row">
      <!-- Liste des articles -->
      <div class="col-lg-8 mb-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h5 mb-0">Articles ({{ cartCount$ | async }})</h2>

          <button
            class="btn btn-outline-primary btn-sm"
            (click)="testOptimizationFunction()"
          >
            <i class="bi bi-gear me-1"></i>Tester l'optimisation
          </button>
        </div>

        <!-- Message panier vide -->
        <div *ngIf="(cartItems$ | async)?.length === 0" class="text-center py-5">
          <i class="bi bi-cart-x display-1 text-muted mb-3"></i>
          <h3>Votre panier est vide</h3>
          <p class="text-muted mb-4">Ajoutez des produits depuis le catalogue pour commencer.</p>
          <a routerLink="/products" class="btn btn-primary">
            <i class="bi bi-arrow-left me-2"></i>Voir le catalogue
          </a>
        </div>

        <!-- Liste des articles -->
        <div >
          <app-cart-item
            *ngFor="let item of cartItemsWithDetails$ | async"
            [item]="item"
            (quantityChange)="onQuantityChange($event)"
            (remove)="onRemoveItem($event)"
          ></app-cart-item>
        </div>
      </div>

      <!-- Résumé -->
      <div class="col-lg-4">
        <app-cart-summary
          [subtotal]="(cartTotal$ | async) || 0"
          [itemCount]="(cartItems$ | async)?.length || 0"
          [totalItems]="(cartCount$ | async) || 0"
          (checkout)="onCheckout()"
          (clearCart)="onClearCart()"
        ></app-cart-summary>

        <!-- Section démonstration algorithmique -->
        <div class="card mt-4 shadow-sm">
          <div class="card-header bg-info text-white">
            <h6 class="mb-0">
              <i class="bi bi-code-slash me-2"></i>Démonstration Algorithmique
            </h6>
          </div>
          <div class="card-body">
            <p class="small">
              <strong>Fonction d'optimisation :</strong> Regroupe les articles similaires par ID et somme leurs quantités.
            </p>

            <div *ngIf="optimizationDemo">
              <div class="alert alert-info small">
                <strong>Input :</strong> {{ optimizationDemo.input | json }}<br>
                <strong>Output :</strong> {{ optimizationDemo.output | json }}
              </div>
            </div>

            <button
              class="btn btn-info btn-sm w-100 mt-2"
              (click)="runOptimizationDemo()"
            >
              <i class="bi bi-play-circle me-1"></i>Lancer la démo
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
    }
  `]
})
export class CartPageComponent implements OnInit {
  private cartStateService = inject(CartStateService)
  // Observables
  cartItems$ = this.cartStateService.cartItems$;
  cartItemsWithDetails$ = this.cartStateService.getCartItemsWithDetails();
  cartCount$ = this.cartStateService.cartCount$;
  cartTotal$ = this.cartStateService.cartTotal$;

  // Pour la démo d'optimisation
  optimizationDemo: { input: any, output: any } | null = null;


  ngOnInit(): void {
    // Logique d'initialisation si nécessaire
  }

  onQuantityChange(event: { productId: number, quantity: number }): void {
    this.cartStateService.updateQuantity(event.productId, event.quantity);
  }

  onRemoveItem(productId: number): void {
    this.cartStateService.removeItem(productId);
  }

  onClearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      this.cartStateService.clearCart();
    }
  }

  onCheckout(): void {
    alert('Fonctionnalité de commande à implémenter avec la synchronisation offline!');
    // TODO: Implémenter avec la synchronisation
  }

  // Méthodes pour la démonstration algorithmique
  runOptimizationDemo(): void {
    // Exemple de données de test
    const testData: OptimizedCartItem[] = [
      { id: 1, qty: 1 },
      { id: 2, qty: 3 },
      { id: 1, qty: 5 },
      { id: 3, qty: 2 },
      { id: 2, qty: 1 }
    ];

    const result = this.cartStateService.optimizeCartExercise(testData);

    this.optimizationDemo = {
      input: testData,
      output: result
    };
  }

  testOptimizationFunction(): void {
    const currentCart = this.cartStateService.cartItemsSubject.value;

    // Convertir au format de test
    const testData: OptimizedCartItem[] = currentCart.map(item => ({
      id: item.productId,
      qty: item.quantity
    }));

    if (testData.length === 0) {
      alert('Ajoutez des articles au panier pour tester l\'optimisation!');
      return;
    }

    const result = this.cartStateService.optimizeCartExercise(testData);

    this.optimizationDemo = {
      input: testData,
      output: result
    };

    // Afficher un message si des articles ont été fusionnés
    if (testData.length > result.length) {
      alert(`${testData.length - result.length} article(s) fusionné(s) avec succès!`);
    }
  }
}
