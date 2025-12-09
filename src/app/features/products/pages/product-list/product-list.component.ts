import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../../../../core/models/product.model';
import {  ProductStateService } from '../../services/product-state.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { CartStateService } from '../../../cart/services/cart-state.service';



@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    ProductCardComponent,
    ProductFiltersComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})

export class ProductListComponent implements OnInit {
  private productStateService = inject(ProductStateService)
  private cartStateService = inject(CartStateService)

  paginatedProducts$ = this.productStateService.paginatedProducts$;
  currentPage$ = this.productStateService.currentPage$;
  totalPages$ = this.productStateService.totalPages$;
  isProductInCartMap = new Map<number, boolean>();

  private cartItems: number[] = [];



  ngOnInit(): void {
       // S'abonner aux changements du panier
    this.cartStateService.cartItems$.subscribe(items => {
      const productIds = new Set(items.map(item => item.productId));

      // Mettre à jour la map
      this.isProductInCartMap.clear();
      productIds.forEach(id => this.isProductInCartMap.set(id, true));
    });
  }



  addProductToCart(product: any): void {
    this.cartStateService.addItem(product);

    // Feedback visuel
    const button = event?.target as HTMLElement;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="bi bi-check-circle"></i> Ajouté!';
      button.classList.add('btn-success');

      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('btn-success');
      }, 1500);
    }
  }

  isProductInCart(productId: number): boolean {
    return this.cartItems.includes(productId);
  }

  previousPage(): void {
    this.productStateService.previousPage();
  }

  nextPage(): void {
    this.productStateService.nextPage();
  }

  goToPage(page: number): void {
    this.productStateService.setPage(page);
  }

  getPageNumbers(): number[] {
    // Logique simple pour afficher jusqu'à 5 pages
    const pages: number[] = [];
    this.totalPages$.subscribe(total => {
      const current = this.currentPage$;
      // Implémentation basique
      for (let i = 1; i <= Math.min(total, 5); i++) {
        pages.push(i);
      }
    }).unsubscribe();

    return pages.length > 0 ? pages : [1];
  }
}
