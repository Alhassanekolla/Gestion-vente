import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  private status$ = new BehaviorSubject<boolean>(navigator.onLine);

  online$ = this.status$.asObservable();

  constructor() {
    fromEvent(window, 'online').subscribe(() => this.status$.next(true));
    fromEvent(window, 'offline').subscribe(() => this.status$.next(false));
  }

  isOnline(): boolean {
    return this.status$.value;
  }
}
