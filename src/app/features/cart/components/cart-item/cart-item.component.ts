import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartItem } from '../../../../core/models/cart-item.model';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card mb-3 shadow-sm">
      <div class="row g-0">
        <!-- Image -->
        <div class="col-md-3">
          <img
            [src]="item.product?.imageUrl || 'https://picsum.photos/seed/default/300/200'"
            [alt]="item.product?.name"
            class="img-fluid rounded-start cart-item-image"
            (error)="onImageError()"
          >
        </div>

        <!-- Détails -->
        <div class="col-md-9">
          <div class="card-body h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="card-title mb-1">{{ item.product?.name }}</h5>
                <p class="card-text text-muted small mb-2">
                  {{ item.product?.price }} FG / unité
                </p>
              </div>

              <button
                class="btn btn-outline-danger btn-sm"
                (click)="remove.emit(item.productId)"
                aria-label="Supprimer"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>

            <!-- Contrôle quantité -->
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <button
                    class="btn btn-outline-secondary btn-sm"
                    (click)="decreaseQuantity()"
                    [disabled]="item.quantity <= 1"
                    aria-label="Réduire"
                  >
                    <i class="bi bi-dash"></i>
                  </button>

                  <input
                    type="number"
                    class="form-control form-control-sm mx-2 text-center"
                    style="width: 70px;"
                    [value]="item.quantity"
                    (change)="onQuantityChange($event)"
                    min="1"
                    max="99"
                  />

                  <button
                    class="btn btn-outline-secondary btn-sm"
                    (click)="increaseQuantity()"
                    aria-label="Augmenter"
                  >
                    <i class="bi bi-plus"></i>
                  </button>
                </div>

                <div class="text-end">
                  <div class="h5 mb-0 text-primary">
                    {{ calculateItemTotal()  }} FG
                  </div>
                  <small class="text-muted">
                    {{ item.quantity }} × {{ item.product?.price  }} FG
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-item-image {
      height: 150px;
      width: 100%;
      object-fit: cover;
    }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="number"] {
      -moz-appearance: textfield;
    }
  `]
})
export class CartItemComponent {
  @Input() item!: CartItem & { productDetails?: Product };
  @Output() quantityChange = new EventEmitter<{productId: number, quantity: number}>();
  @Output() remove = new EventEmitter<number>();

  private defaultImage = 'https://picsum.photos/seed/default/300/200';

  onImageError(): void {
    if (this.item.product) {
      this.item.product.imageUrl = this.defaultImage;
    }
  }

  decreaseQuantity(): void {
    if (this.item.quantity > 1) {
      this.quantityChange.emit({
        productId: this.item.productId,
        quantity: this.item.quantity - 1
      });
    }
  }

  increaseQuantity(): void {
    this.quantityChange.emit({
      productId: this.item.productId,
      quantity: this.item.quantity + 1
    });
  }

  onQuantityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value, 10);

    if (!isNaN(quantity) && quantity >= 1) {
      this.quantityChange.emit({
        productId: this.item.productId,
        quantity
      });
    }
  }

  calculateItemTotal(): number {
    return (this.item.product?.price || 0) * this.item.quantity;
  }
}
