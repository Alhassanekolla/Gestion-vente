import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductApiService } from '../../../core/services/api/product-api.service';
import { OfflineManagerService } from '../../../core/services/offline/offline-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ProductStateService {
  private products = new BehaviorSubject<any[]>([]);
  private filteredProducts = new BehaviorSubject<any[]>([]);
  private categories = new BehaviorSubject<string[]>([]);

  private currentPage = 1;
  private itemsPerPage = 6;

  products$ = this.products.asObservable();
  filteredProducts$ = this.filteredProducts.asObservable();
  categories$ = this.categories.asObservable();

  constructor(
    private productApi: ProductApiService,
    private offline: OfflineManagerService
  ) {
    this.loadProducts();
  }

  loadProducts() {
    this.productApi.getProducts().subscribe({
      next: (data) => {
        this.products.next(data);
        this.filteredProducts.next(data);
        this.extractCategories(data);

        this.offline.cacheProducts(data).catch(() => {
          console.log('Erreur cache produits');
        });
      },
      error: (error) => {
        console.log('Erreur API produits:', error);

        this.offline.getCachedProducts().then(cached => {
          if (cached.length > 0) {
            this.products.next(cached);
            this.filteredProducts.next(cached);
            this.extractCategories(cached);
          }
        });
      }
    });
  }

  private extractCategories(products: any[]) {
    const cats = [...new Set(products.map(p => p.category))];
    this.categories.next(cats);
  }

  updateFilters(name: string, category: string) {
    let filtered = [...this.products.value];

    if (name) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    this.filteredProducts.next(filtered);
    this.currentPage = 1;
  }

  updateSort(sortBy: string) {
    const sorted = [...this.filteredProducts.value];

    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    this.filteredProducts.next(sorted);
  }

  getPaginatedProducts() {
    const all = this.filteredProducts.value;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return all.slice(start, start + this.itemsPerPage);
  }

  getTotalPages() {
    return Math.ceil(this.filteredProducts.value.length / this.itemsPerPage);
  }

  nextPage() {
    const total = this.getTotalPages();
    if (this.currentPage < total) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number) {
    const total = this.getTotalPages();
    if (page >= 1 && page <= total) {
      this.currentPage = page;
    }
  }

  getProductById(id: number) {
    return this.products.value.find(p => p.id === id);
  }

  getCurrentPage() {
    return this.currentPage;
  }
}
