import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { ProductApiService } from '../../../core/services/api/product-api.service';
import { Product, ProductFilters, SortOption }from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductStateService {

  private productsSubject = new BehaviorSubject<Product[]>([]);
  private filtersSubject = new BehaviorSubject<ProductFilters>({
    name: '',
    category: ''
  });
  private sortSubject = new BehaviorSubject<SortOption>('price-asc');
  private currentPageSubject = new BehaviorSubject<number>(1);
  private itemsPerPage = 6;


  products$ = this.productsSubject.asObservable();
  filteredProducts$: Observable<Product[]> ;
  categories$: Observable<string[]>;
  paginatedProducts$: Observable<Product[]>;
  totalPages$: Observable<number>;
  currentPage$ = this.currentPageSubject.asObservable();

  constructor(private productApiService: ProductApiService) {

    this.loadProducts();

    this.categories$ = this.productApiService.getCategories();


    this.filteredProducts$ = combineLatest([
      this.products$,
      this.filtersSubject,
      this.sortSubject
    ]).pipe(
      map(([products, filters, sortOption]) => {
        let filtered = [...products];


        if (filters.name) {
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(filters.name.toLowerCase())
          );
        }

        if (filters.category) {
          filtered = filtered.filter(p => p.category === filters.category);
        }

        return this.sortProducts(filtered, sortOption);
      })
    );

    this.paginatedProducts$ = combineLatest([
      this.filteredProducts$,
      this.currentPage$
    ]).pipe(
      map(([products, currentPage]) => {
        const startIndex = (currentPage - 1) * this.itemsPerPage;
        return products.slice(startIndex, startIndex + this.itemsPerPage);
      })
    );

    this.totalPages$ = this.filteredProducts$.pipe(
      map(products => Math.ceil(products.length / this.itemsPerPage))
    );
  }

  private loadProducts(): void {
    this.productApiService.getProducts().subscribe({
      next: (products) => {
        this.productsSubject.next(products);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.productsSubject.next([]);
      }
    });
  }

  private sortProducts(products: Product[], sortOption: SortOption): Product[] {
    const sorted = [...products];

    switch (sortOption) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }

  updateFilters(filters: Partial<ProductFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
    this.setPage(1);
  }

  updateSort(sortOption: SortOption): void {
    this.sortSubject.next(sortOption);
  }

  setPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  nextPage(): void {
    const current = this.currentPageSubject.value;
    this.setPage(current + 1);
  }

  previousPage(): void {
    const current = this.currentPageSubject.value;
    if (current > 1) {
      this.setPage(current - 1);
    }
  }

  getProductById(id: number): Product | undefined {
    return this.productsSubject.value.find(p => p.id === id);
  }

  refreshProducts(): void {
    this.loadProducts();
  }
}
