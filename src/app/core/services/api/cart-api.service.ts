import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { CartItem } from '../../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartApiService extends BaseApiService {
  private readonly ENDPOINT = 'cart';

  getCart(): Observable<CartItem[]> {
    return this.get<CartItem[]>(this.ENDPOINT);
  }

  updateCart(items: CartItem[]): Observable<CartItem[]> {

    return this.put<CartItem[]>(this.ENDPOINT, items);
  }

  clearCart(): Observable<void> {
    return this.put<void>(this.ENDPOINT, []);
  }
}
