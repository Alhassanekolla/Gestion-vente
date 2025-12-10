import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem } from '../../models/cart-item.model';
import { environment } from '../../../../environnements/environnement';

@Injectable({
  providedIn: 'root'
})
export class CartApiService {

  private apiUrl = environment.apiUrl;
  private cartId = 1;

  constructor(private http: HttpClient) {}

  getCart(): Observable<CartItem[]> {
    return this.http.get<any>(`${this.apiUrl}/cart/${this.cartId}`).pipe(
      map(response => response?.items || []),
      catchError(err => {
        if (err.status === 404) {
          return of([]);
        }
        return of([]);
      })
    );
  }

  updateCart(items: CartItem[]): Observable<CartItem[]> {
    const body = { id: this.cartId, items };

    return this.http.put<any>(`${this.apiUrl}/cart/${this.cartId}`, body).pipe(
      map(res => res?.items || items),
      catchError(err => {
        if (err.status === 404) {
          return this.http.post<any>(`${this.apiUrl}/cart`, body).pipe(
            map(res => res?.items || items)
          );
        }
        return of(items);
      })
    );
  }

  clearCart(): Observable<void> {
    const empty = { id: this.cartId, items: [] };

    return this.http.put(`${this.apiUrl}/cart/${this.cartId}`, empty).pipe(
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }
}
