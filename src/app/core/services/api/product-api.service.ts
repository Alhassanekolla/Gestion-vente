import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService extends BaseApiService {

  private endpoint = 'products';

  getProducts(): Observable<Product[]> {
    return this.get<Product[]>(this.endpoint);
  }

  getProductById(id: number): Observable<Product> {
    return this.get<Product>(`${this.endpoint}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.getProducts().pipe(
      map(products => [...new Set(products.map(p => p.category))])
    );
  }
}
