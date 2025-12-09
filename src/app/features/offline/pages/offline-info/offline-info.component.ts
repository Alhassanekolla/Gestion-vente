import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineManagerService } from '../../../../core/services/offline/offline-manager.service';

@Component({
  selector: 'app-offline-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row mb-4">
      <div class="col-12">
        <h1 class="display-6 mb-3">
          <i class="bi bi-database me-2"></i>Informations Mode Offline
        </h1>
        <p class="text-muted">Gestion du stockage local et de la synchronisation.</p>
      </div>
    </div>

    <!-- Carte Statut -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header" [class.bg-success]="isOnline" [class.bg-danger]="!isOnline">
            <h5 class="mb-0 text-white">
              <i class="bi bi-wifi me-2"></i>Statut Réseau
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <i class="bi display-4" [class.bi-wifi]="isOnline" [class.bi-wifi-off]="!isOnline"
                   [class.text-success]="isOnline" [class.text-danger]="!isOnline"></i>
              </div>
              <div>
                <h3 class="mb-1">{{ isOnline ? 'Connecté' : 'Hors ligne' }}</h3>
                <p class="text-muted mb-0">
                  {{ isOnline ? 'Synchronisation automatique activée' : 'Mode offline actif' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">
              <i class="bi bi-cloud-arrow-up me-2"></i>Synchronisation
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <i class="bi bi-clock-history display-4 text-info"></i>
              </div>
              <div>
                <h3 class="mb-1">{{ syncQueueSize }} action(s)</h3>
                <p class="text-muted mb-0">en attente de synchronisation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Carte Stockage Local -->
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">
          <i class="bi bi-hdd me-2"></i>Stockage Local (IndexedDB)
        </h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="text-center p-3 border rounded">
              <i class="bi bi-grid display-4 text-primary mb-2"></i>
              <h4>{{ dbInfo.products }}</h4>
              <p class="text-muted mb-0">Produits stockés</p>
            </div>
          </div>

          <div class="col-md-4">
            <div class="text-center p-3 border rounded">
              <i class="bi bi-cart display-4 text-success mb-2"></i>
              <h4>{{ dbInfo.cartItems }}</h4>
              <p class="text-muted mb-0">Articles en panier</p>
            </div>
          </div>

          <div class="col-md-4">
            <div class="text-center p-3 border rounded">
              <i class="bi bi-clock display-4 text-warning mb-2"></i>
              <h4>{{ dbInfo.pendingActions }}</h4>
              <p class="text-muted mb-0">Actions en attente</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="card shadow-sm">
      <div class="card-header bg-secondary text-white">
        <h5 class="mb-0">
          <i class="bi bi-gear me-2"></i>Actions
        </h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <button
              class="btn btn-outline-primary w-100"
              (click)="refreshDatabaseInfo()"
              [disabled]="loading"
            >
              <i class="bi bi-arrow-clockwise me-2" *ngIf="!loading"></i>
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Actualiser les informations
            </button>
          </div>

          <div class="col-md-6">
            <button
              class="btn btn-outline-danger w-100"
              (click)="clearOfflineData()"
              [disabled]="loading"
            >
              <i class="bi bi-trash me-2"></i>
              Vider le cache offline
            </button>
          </div>

          <div class="col-12">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Fonctionnement offline :</strong>
              Les données sont automatiquement sauvegardées localement.
              En cas de perte de connexion, vous pouvez continuer à naviguer
              et modifier votre panier.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OfflineInfoComponent implements OnInit {
  isOnline = true;
  syncQueueSize = 0;
  dbInfo = {
    products: 0,
    cartItems: 0,
    pendingActions: 0
  };
  loading = false;

  constructor(private offlineManager: OfflineManagerService) {}

  ngOnInit(): void {
    this.loadDatabaseInfo();

    // S'abonner aux observables
    this.offlineManager.isOnline$.subscribe(online => {
      this.isOnline = online;
    });

    this.offlineManager.syncQueueSize$.subscribe(size => {
      this.syncQueueSize = size;
    });
  }

  async loadDatabaseInfo(): Promise<void> {
    this.loading = true;
    try {
      const info = await this.offlineManager.getDatabaseInfo();
      this.dbInfo = {
        products: info.products,
        cartItems: info.cartItems,
        pendingActions: info.pendingActions
      };
      this.isOnline = info.isOnline;
    } catch (error) {
      console.error('Erreur lors du chargement des infos:', error);
    } finally {
      this.loading = false;
    }
  }

  refreshDatabaseInfo(): void {
    this.loadDatabaseInfo();
  }

  async clearOfflineData(): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir vider toutes les données offline ? Cette action est irréversible.')) {
      this.loading = true;
      try {
        await this.offlineManager.clearAllOfflineData();
        await this.loadDatabaseInfo();
        alert('Données offline effacées avec succès');
      } catch (error) {
        console.error('Erreur lors du vidage des données:', error);
        alert('Erreur lors du vidage des données');
      } finally {
        this.loading = false;
      }
    }
  }
}
