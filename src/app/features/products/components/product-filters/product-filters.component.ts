import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductStateService } from '../../services/product-state.service';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.component.html'
})
export class ProductFiltersComponent {
  private productService = inject(ProductStateService);

  searchText = '';
  selectedCategory = '';
  sortBy = 'price-asc';

  categories$ = this.productService.categories$;
  productCount = 0;

  ngOnInit() {
    this.productService.filteredProducts$.subscribe(products => {
      this.productCount = products.length;
    });
  }

  onSearchChange() {
  this.productService.updateFilters(this.searchText, this.selectedCategory);
}

  onSortChange() {
    this.productService.updateSort(this.sortBy);
  }

  clearAll() {
    this.searchText = '';
    this.selectedCategory = '';
    this.sortBy = 'price-asc';

    this.productService.updateFilters('', '');
    this.productService.updateSort('price-asc');
}
}
