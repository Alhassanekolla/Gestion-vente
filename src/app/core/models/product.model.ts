export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
}



export interface ProductFilters {
  name: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
}


export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
