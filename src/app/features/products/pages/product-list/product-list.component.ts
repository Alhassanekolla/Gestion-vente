import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../../../../core/models/product.model';
import {  ProductStateService } from '../../services/product-state.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';



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

  paginatedProducts$ = this.productStateService.paginatedProducts$;
  currentPage$ = this.productStateService.currentPage$;
  totalPages$ = this.productStateService.totalPages$;


  private cartItems: number[] = [];



  ngOnInit(): void {

  }

  addProductToCart(product: any): void {
    console.log('Ajout au panier:', product);
    // TODO: Implémenter l'ajout au panier
    this.cartItems.push(product.id);
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
