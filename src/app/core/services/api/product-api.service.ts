import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService extends BaseApiService {
  private readonly ENDPOINT = 'products';

  getProducts(): Observable<Product[]> {
    return this.get<Product[]>(this.ENDPOINT);
  }

  getProductById(id: number): Observable<Product> {
    return this.get<Product>(`${this.ENDPOINT}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return new Observable(subscriber => {
      this.getProducts().subscribe(products => {
        const categories = [...new Set(products.map(p => p.category))];
        subscriber.next(categories);
        subscriber.complete();
      });
    });
  }
}
