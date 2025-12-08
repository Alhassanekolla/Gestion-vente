import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductStateService } from '../../services/product-state.service';
import { Product, ProductFilters, SortOption } from '../../../../core/models/product.model';
import { map } from 'rxjs';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.css'
})
export class ProductFiltersComponent {

  filters: ProductFilters = {
    name: '',
    category: ''
  };

  private productStateService = inject(ProductStateService)

  sortOption: SortOption = 'price-asc';
  categories$ = this.productStateService.categories$;
  totalProducts$ = this.productStateService.filteredProducts$.pipe(
    map((products: Product[]) => products.length)
  );


  ngOnInit(): void {

  }

  onFilterChange(): void {
    this.productStateService.updateFilters(this.filters);
  }

  onSortChange(): void {
    this.productStateService.updateSort(this.sortOption);
  }

  clearFilters(): void {
    this.filters = { name: '', category: '' };
    this.sortOption = 'price-asc';
    this.productStateService.updateFilters(this.filters);
    this.productStateService.updateSort(this.sortOption);
  }
}
