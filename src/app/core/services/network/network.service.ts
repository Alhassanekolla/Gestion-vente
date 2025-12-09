import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineStatusSubject = new BehaviorSubject<boolean>(navigator.onLine);

  onlineStatus$ = this.onlineStatusSubject.asObservable();

  constructor() {
    // Écouter les changements de statut réseau
    fromEvent(window, 'online').subscribe(() => {
      this.onlineStatusSubject.next(true);
    });

    fromEvent(window, 'offline').subscribe(() => {
      this.onlineStatusSubject.next(false);
    });
  }

  isOnline(): boolean {
    return this.onlineStatusSubject.value;
  }

  // Simuler la déconnexion pour les tests
  simulateOffline(): void {
    if (this.onlineStatusSubject.value) {
      this.onlineStatusSubject.next(false);

      // Restaurer après 5 secondes
      setTimeout(() => {
        this.onlineStatusSubject.next(true);
      }, 5000);
    }
  }
}
