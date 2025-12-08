import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() isInCart = false;
  @Output() addToCart = new EventEmitter<Product>();

  defaultImage = 'https://picsum.photos/seed/default/300/200';

  onAddToCart(): void {
    if (this.product.stock > 0) {
      this.addToCart.emit(this.product);
    }
  }

  onImageError(): void {
    this.product.imageUrl = this.defaultImage;
  }
}
