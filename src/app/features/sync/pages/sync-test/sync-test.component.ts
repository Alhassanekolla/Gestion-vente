import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncService } from '../../../../core/services/sync/sync.service';
import { OfflineManagerService } from '../../../../core/services/offline/offline-manager.service';

@Component({
  selector: 'app-sync-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h2 class="mb-4">
        <i class="bi bi-cloud-arrow-up me-2"></i>Test Synchronisation
      </h2>

      <!-- Statut -->
      <div class="row mb-4">
        <div class="col-md-4 mb-3">
          <div class="card text-center">
            <div class="card-body">
              <h3 class="mb-2">{{ pendingActions }}</h3>
              <p class="text-muted small">Actions en attente</p>
            </div>
          </div>
        </div>

        <div class="col-md-4 mb-3">
          <div class="card text-center">
            <div class="card-body">
              <h3 class="mb-2">{{ lastSync ? (lastSync | date:'HH:mm') : '--:--' }}</h3>
              <p class="text-muted small">Dernière sync</p>
            </div>
          </div>
        </div>

        <div class="col-md-4 mb-3">
          <div class="card text-center">
            <div class="card-body">
              <h3 class="mb-2">{{ isOnline ? 'En ligne' : 'Offline' }}</h3>
              <p class="text-muted small">Statut réseau</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-3">Actions de test</h5>

          <div class="row g-2 mb-3">
            <div class="col-md-6">
              <button class="btn btn-primary w-100"
                      (click)="startSync()"
                      [disabled]="syncing || !isOnline">
                <i class="bi bi-cloud-arrow-up me-1"></i>
                Synchroniser
              </button>
            </div>

            <div class="col-md-6">
              <button class="btn btn-outline-danger w-100"
                      (click)="clearQueue()"
                      [disabled]="pendingActions === 0">
                <i class="bi bi-trash me-1"></i>
                Vider file
              </button>
            </div>
          </div>

          <div class="row g-2">
            <div class="col-md-6">
              <button class="btn btn-outline-info w-100"
                      (click)="addTestAction()">
                <i class="bi bi-plus me-1"></i>
                Ajouter test
              </button>
            </div>

            <div class="col-md-6">
              <button class="btn btn-outline-secondary w-100"
                      (click)="checkStatus()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Vérifier
              </button>
            </div>
          </div>

          <!-- Info sync -->
          <div class="mt-4 p-3 bg-light rounded">
            <div class="d-flex align-items-center mb-2">
              <i class="bi bi-info-circle me-2 text-primary"></i>
              <strong>Comment tester :</strong>
            </div>
            <p class="mb-0 small">
              1. Mettez-vous hors ligne (F12 → Network → Offline)<br>
              2. Ajoutez un produit au panier<br>
              3. Remettez-vous en ligne<br>
              4. Cliquez sur "Synchroniser"
            </p>
          </div>

          <!-- Statut actuel -->
          <div class="mt-3">
            <div class="alert" [class.alert-warning]="syncing" [class.alert-success]="!syncing">
              <div *ngIf="syncing">
                <i class="bi bi-arrow-repeat spin me-1"></i>
                Synchronisation en cours...
              </div>
              <div *ngIf="!syncing">
                <i class="bi bi-check-circle me-1"></i>
                Prêt à synchroniser
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spin {
      animation: spin 1s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SyncTestComponent implements OnInit {
  syncing = false;
  pendingActions = 0;
  lastSync: Date | null = null;
  isOnline = navigator.onLine;

  constructor(
    private syncService: SyncService,
    private offline: OfflineManagerService
  ) {}

  async ngOnInit() {
    await this.checkQueue();
         window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

   
    setInterval(() => {
      this.checkQueue();
    }, 3000);
  }

  async startSync() {
    if (!this.isOnline) {
      alert('Vous êtes hors ligne');
      return;
    }

    this.syncing = true;

    try {
      await this.syncService.sync();
      this.lastSync = new Date();
      await this.checkQueue();
      alert('Sync réussie!');
    } catch (error) {
      console.log('Erreur sync:', error);
      alert('Erreur lors de la sync');
    } finally {
      this.syncing = false;
    }
  }

  async clearQueue() {
    if (confirm('Vider toutes les actions en attente ?')) {
      await this.offline.clearAll();
      this.pendingActions = 0;
      alert('File vidée');
    }
  }

  async addTestAction() {
    await this.offline.queueAction({
      type: 'UPDATE_CART',
      payload: [{ productId: 999, quantity: 1 }],
      timestamp: new Date()
    });

    await this.checkQueue();
    alert('Action test ajoutée');
  }

  async checkQueue() {
    try {
      const queue = await this.offline.getQueue();
      this.pendingActions = queue.length;
    } catch (error) {
      console.log('Erreur check queue:', error);
    }
  }

  async checkStatus() {
    await this.checkQueue();
    alert(`Actions en attente: ${this.pendingActions}`);
  }
}
