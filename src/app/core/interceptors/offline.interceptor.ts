import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OfflineStorageService } from '../services/offline/offline-storage.service';
import { OfflineManagerService } from '../services/offline/offline-manager.service';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {

  constructor(
    private db: OfflineStorageService,
    private offline: OfflineManagerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const online = navigator.onLine;

    if (!online) {
      return this.handleOffline(req);
    }

    return next.handle(req).pipe(
      catchError(() => this.handleOffline(req)),
      map(event => {
        if (event instanceof HttpResponse) {
          this.cacheIfNeeded(req, event.body);
        }
        return event;
      })
    );
  }


  private handleOffline(req: HttpRequest<any>): Observable<HttpEvent<any>> {

    if (req.method === 'GET' && req.url.includes('/products')) {
      return from(this.db.getProducts()).pipe(
        map(items => new HttpResponse({ body: items, status: 200 }))
      );
    }

    if (req.method === 'GET' && req.url.includes('/cart')) {
      return from(this.db.getCart()).pipe(
        map(items => new HttpResponse({ body: items, status: 200 }))
      );
    }

   if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return from(this.queueMutation(req)).pipe(
        map(() => new HttpResponse({
          body: { queued: true },
          status: 202
        }))
      );
    }

    return throwError(() => new Error('Non disponible hors-ligne'));
  }

  /** Ajout dans la file de synchronisation */
  private queueMutation(req: HttpRequest<any>) {
    let type: 'ADD_TO_CART' | 'UPDATE_CART' | 'CLEAR_CART';

    if (req.url.includes('/cart')) {
      if (req.method === 'DELETE') type = 'CLEAR_CART';
      else if (req.method === 'POST') type = 'ADD_TO_CART';
      else type = 'UPDATE_CART';
    } else {
      throw new Error('Endpoint non supporté');
    }

    return this.offline.queueAction({
      type,
      payload: req.body,
      timestamp: new Date()
    });
  }

  /** Mise en cache offline */
  private cacheIfNeeded(req: HttpRequest<any>, body: any) {

    if (req.url.includes('/products') && Array.isArray(body)) {
      this.offline.cacheProducts(body);
    }

    if (req.url.includes('/cart') && Array.isArray(body)) {
      this.offline.saveCart(body);
    }
  }
}
