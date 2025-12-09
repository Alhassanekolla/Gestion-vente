import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { ProductApiService } from '../../../core/services/api/product-api.service';
import { OfflineManagerService } from '../../../core/services/offline/offline-manager.service';
import { Product, ProductFilters, SortOption } from '../../../core/models/product.model';

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

  private offlineManager = inject(OfflineManagerService);

  // Observables publics
  products$ = this.productsSubject.asObservable();
  filteredProducts$: Observable<Product[]>;
  categories$: Observable<string[]>;
  paginatedProducts$: Observable<Product[]>;
  totalPages$: Observable<number>;
  currentPage$ = this.currentPageSubject.asObservable();

  constructor(private productApiService: ProductApiService) {
    this.loadProducts();

    // Récupérer les catégories
    this.categories$ = this.productApiService.getCategories();

    // Combiner filtres et tri
    this.filteredProducts$ = combineLatest([
      this.products$,
      this.filtersSubject,
      this.sortSubject
    ]).pipe(
      map(([products, filters, sortOption]) => {
        let filtered = [...products];

        // Filtre par nom
        if (filters.name) {
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(filters.name.toLowerCase())
          );
        }

        // Filtre par catégorie
        if (filters.category) {
          filtered = filtered.filter(p => p.category === filters.category);
        }

        // Tri
        return this.sortProducts(filtered, sortOption);
      })
    );

    // Pagination
    this.paginatedProducts$ = combineLatest([
      this.filteredProducts$,
      this.currentPage$
    ]).pipe(
      map(([products, currentPage]) => {
        const startIndex = (currentPage - 1) * this.itemsPerPage;
        return products.slice(startIndex, startIndex + this.itemsPerPage);
      })
    );

    // Calcul du nombre total de pages
    this.totalPages$ = this.filteredProducts$.pipe(
      map(products => Math.ceil(products.length / this.itemsPerPage))
    );
  }

  private loadProducts(): void {
    // Stratégie simplifiée: charger depuis le réseau, puis mettre en cache
    this.productApiService.getProducts().subscribe({
      next: (products) => {
        // Mettre à jour le state
        this.productsSubject.next(products);

        // Mettre en cache (silencieusement)
        this.offlineManager.cacheProducts(products).catch(() => {
          // Ignorer les erreurs de cache
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);

        // En cas d'erreur, essayer depuis le cache
        this.offlineManager.getProductsWithCacheFirst()
          .then(cachedProducts => {
            if (cachedProducts.length > 0) {
              this.productsSubject.next(cachedProducts);
            }
          })
          .catch(cacheError => {
            console.error('Erreur du cache aussi:', cacheError);
          });
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

  // Méthodes publiques
  updateFilters(filters: Partial<ProductFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
    this.setPage(1); // Réinitialiser à la première page
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
