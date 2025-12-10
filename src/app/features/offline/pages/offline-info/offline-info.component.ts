import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineManagerService } from '../../../../core/services/offline/offline-manager.service';

@Component({
  selector: 'app-offline-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h2 class="mb-3">
        <i class="bi bi-database me-2"></i>Mode Offline
      </h2>
      <p class="text-muted mb-4">
        Gestion du stockage local et synchronisation
      </p>

      <!-- Statut -->
      <div class="row mb-4">
        <div class="col-md-6 mb-3">
          <div class="card">
            <div class="card-body text-center">
              <i class="bi display-4 mb-3"
                 [class.bi-wifi]="isOnline"
                 [class.bi-wifi-off]="!isOnline"
                 [class.text-success]="isOnline"
                 [class.text-danger]="!isOnline"></i>
              <h4>{{ isOnline ? 'En ligne' : 'Hors ligne' }}</h4>
              <p class="small text-muted">
                {{ isOnline ? 'Connecté' : 'Mode offline actif' }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-md-6 mb-3">
          <div class="card">
            <div class="card-body text-center">
              <i class="bi bi-cloud-arrow-up display-4 text-info mb-3"></i>
              <h4>{{ queueSize }} actions</h4>
              <p class="small text-muted">
                En attente de sync
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stockage -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">Stockage local</h5>
        </div>
        <div class="card-body">
          <div class="row text-center">
            <div class="col-4">
              <div class="p-3">
                <div class="h4 mb-2 text-primary">{{ storage.products }}</div>
                <div class="small text-muted">Produits</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-3">
                <div class="h4 mb-2 text-success">{{ storage.cart }}</div>
                <div class="small text-muted">Panier</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-3">
                <div class="h4 mb-2 text-warning">{{ storage.queue }}</div>
                <div class="small text-muted">Actions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-6">
              <button class="btn btn-outline-primary w-100"
                      (click)="refresh()"
                      [disabled]="loading">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Actualiser
              </button>
            </div>
            <div class="col-md-6">
              <button class="btn btn-outline-danger w-100"
                      (click)="clearData()"
                      [disabled]="loading">
                <i class="bi bi-trash me-1"></i>
                Vider cache
              </button>
            </div>
          </div>

          <div class="mt-4 p-3 bg-light rounded">
            <p class="mb-0 small">
              <i class="bi bi-info-circle me-1"></i>
              Les données sont sauvegardées localement et synchronisées automatiquement quand vous êtes en ligne.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OfflineInfoComponent implements OnInit {
  isOnline = true;
  queueSize = 0;
  storage = {
    products: 0,
    cart: 0,
    queue: 0
  };
  loading = false;

  constructor(private offline: OfflineManagerService) {}

  async ngOnInit() {
    await this.loadData();


    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

   
    setInterval(() => {
      this.checkQueue();
    }, 5000);
  }

  async loadData() {
    this.loading = true;

    try {
      // Charger les infos de stockage
      const products = await this.offline.getCachedProducts();
      const cart = await this.offline.getCachedCart();
      const queue = await this.offline.getQueue();

      this.storage.products = products.length;
      this.storage.cart = cart.length;
      this.storage.queue = queue.length;
      this.queueSize = queue.length;

      this.isOnline = navigator.onLine;
    } catch (error) {
      console.log('Erreur chargement données:', error);
    } finally {
      this.loading = false;
    }
  }

  async checkQueue() {
    try {
      const queue = await this.offline.getQueue();
      this.queueSize = queue.length;
      this.storage.queue = queue.length;
    } catch (error) {
      console.log('Erreur check queue:', error);
    }
  }

  refresh() {
    this.loadData();
  }

  async clearData() {
    if (confirm('Vider tout le cache local ?')) {
      this.loading = true;
      try {
        await this.offline.clearAll();
        await this.loadData();
        alert('Cache vidé');
      } catch (error) {
        console.log('Erreur vidage:', error);
        alert('Erreur');
      } finally {
        this.loading = false;
      }
    }
  }
}
