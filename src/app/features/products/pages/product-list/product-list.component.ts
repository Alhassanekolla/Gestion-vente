import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { ProductStateService } from '../../services/product-state.service';
import { CartStateService } from '../../../cart/services/cart-state.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, ProductFiltersComponent],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductStateService);
  private cartService = inject(CartStateService);


  products: any[] = [];
  currentPage = 1;
  totalPages = 1;


  inCartProducts: number[] = [];

  ngOnInit() {

    this.productService.filteredProducts$.subscribe(products => {
      this.products = products;
      this.totalPages = this.productService.getTotalPages();
      this.currentPage = this.productService.getCurrentPage();
    });


    this.cartService.cartItems$.subscribe(items => {
      this.inCartProducts = items.map(item => item.productId);
    });
  }

  addToCart(product: any, event?: Event) {
    this.cartService.addItem(product);

   
    if (event) {
      const button = event.target as HTMLElement;
      if (button) {
        const original = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i>';
        button.classList.add('btn-success');

        setTimeout(() => {
          button.innerHTML = original;
          button.classList.remove('btn-success');
        }, 1000);
      }
    }
  }

  isInCart(productId: number): boolean {
    return this.inCartProducts.includes(productId);
  }

  prevPage() {
    this.productService.prevPage();
    this.currentPage = this.productService.getCurrentPage();
  }

  nextPage() {
    this.productService.nextPage();
    this.currentPage = this.productService.getCurrentPage();
  }

  goToPage(page: number) {
    this.productService.goToPage(page);
    this.currentPage = page;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const max = Math.min(this.totalPages, 5);

    for (let i = 1; i <= max; i++) {
      pages.push(i);
    }

    return pages;
  }

  get paginatedProducts() {
    return this.productService.getPaginatedProducts();
  }
}
