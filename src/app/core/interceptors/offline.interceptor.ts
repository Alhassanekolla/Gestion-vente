import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { OfflineManagerService } from '../services/offline/offline-manager.service';
import { OfflineStorageService } from '../services/offline/offline-storage.service';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
  private isOnline = navigator.onLine;

  constructor(
    private offlineManager: OfflineManagerService,
    private offlineStorage: OfflineStorageService
  ) {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifier si on est hors ligne
    if (!this.isOnline) {
      return this.handleOfflineRequest(request);
    }

    // En ligne : gérer normalement avec gestion d'erreurs
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si erreur réseau, traiter comme hors ligne
        if (error.status === 0 || error.status >= 500) {
          console.warn('Erreur réseau détectée, basculement en mode offline:', error);
          return this.handleOfflineRequest(request);
        }

        // Pour les autres erreurs, propager normalement
        return throwError(() => error);
      }),
      // Intercepter les réponses réussies pour mettre en cache
      map(event => {
        if (event instanceof HttpResponse) {
          this.cacheResponseIfNeeded(request, event);
        }
        return event;
      })
    );
  }

  private handleOfflineRequest(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    // Stratégie différente selon la méthode HTTP
    switch (request.method) {
      case 'GET':
        return this.handleOfflineGet(request);

      case 'POST':
      case 'PUT':
      case 'DELETE':
        return this.handleOfflineMutation(request);

      default:
        return throwError(() => new Error('Requête non supportée en mode offline'));
    }
  }

  private handleOfflineGet(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    const url = request.url;

    // Produits
    if (url.includes('/products')) {
      return from(this.offlineStorage.getProducts()).pipe(
        map(products => {
          console.log(`Retour de ${products.length} produits depuis le cache offline`);

          // Filtrer si query params
          const searchParams = new URLSearchParams(url.split('?')[1]);
          const search = searchParams.get('q');
          const category = searchParams.get('category');

          let filteredProducts = products;

          if (search) {
            filteredProducts = filteredProducts.filter(p =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.description?.toLowerCase().includes(search.toLowerCase())
            );
          }

          if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
          }

          return new HttpResponse({
            body: filteredProducts,
            status: 200,
            statusText: 'OK (from cache)'
          });
        }),
        catchError(() => {
          return throwError(() => new Error('Données non disponibles en mode offline'));
        })
      );
    }

    // Panier
    if (url.includes('/cart')) {
      return from(this.offlineStorage.getCartItems()).pipe(
        map(cartItems => {
          return new HttpResponse({
            body: cartItems,
            status: 200,
            statusText: 'OK (from cache)'
          });
        }),
        catchError(() => {
          return throwError(() => new Error('Panier non disponible en mode offline'));
        })
      );
    }

    // Pour les autres GET, retourner une erreur
    return throwError(() => new Error('Ressource non disponible en mode offline'));
  }

  private handleOfflineMutation(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    // Pour les mutations, on les stocke dans la file d'attente
    return from(this.queueMutation(request)).pipe(
      map(() => {
        // Retourner une réponse simulée
        return new HttpResponse({
          body: {
            message: 'Action enregistrée pour synchronisation ultérieure',
            queued: true,
            timestamp: new Date().toISOString()
          },
          status: 202, // Accepted
          statusText: 'Accepted (queued for sync)'
        });
      }),
      catchError(error => {
        return throwError(() => new Error(`Échec de l'enregistrement de l'action: ${error.message}`));
      })
    );
  }

  private async queueMutation(request: HttpRequest<any>): Promise<number> {
    // Déterminer le type d'action
    let type: 'ADD_TO_CART' | 'UPDATE_CART' | 'CLEAR_CART';

    if (request.url.includes('/cart')) {
      if (request.method === 'POST') {
        type = 'ADD_TO_CART';
      } else if (request.method === 'PUT') {
        type = 'UPDATE_CART';
      } else if (request.method === 'DELETE') {
        type = 'CLEAR_CART';
      } else {
        throw new Error(`Méthode non supportée: ${request.method}`);
      }
    } else {
      throw new Error(`Endpoint non supporté: ${request.url}`);
    }

    // Ajouter à la file d'attente
    return this.offlineManager.addToSyncQueue({
      type,
      payload: request.body,
      timestamp: new Date()
    });
  }

  private cacheResponseIfNeeded(request: HttpRequest<any>, response: HttpResponse<any>): void {
    // Mettre en cache les produits
    if (request.method === 'GET' && request.url.includes('/products')) {
      const products = response.body;
      if (Array.isArray(products)) {
        this.offlineManager.cacheProducts(products).catch(error => {
          console.warn('Échec de la mise en cache des produits:', error);
        });
      }
    }

    // Mettre en cache le panier (si GET sur /cart)
    if (request.method === 'GET' && request.url.includes('/cart')) {
      const cartItems = response.body;
      if (Array.isArray(cartItems)) {
        this.offlineManager.saveCartToOffline(cartItems).catch(error => {
          console.warn('Échec de la mise en cache du panier:', error);
        });
      }
    }
  }
}
