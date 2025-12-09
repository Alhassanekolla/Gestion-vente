import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncService } from '../../../core/services/sync/sync.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-status" [class.syncing]="isSyncing">
      <div class="d-flex align-items-center">
        <div class="status-indicator me-2" [class.syncing]="isSyncing"></div>

        <div>
          <small class="d-block text-muted">
            <i class="bi" [class.bi-cloud-check]="!isSyncing && pendingActions === 0"
                       [class.bi-cloud-arrow-up]="isSyncing"
                       [class.bi-cloud-slash]="!isOnline"></i>

            {{ getStatusText() }}
          </small>

          <small *ngIf="pendingActions > 0" class="text-warning d-block">
            {{ pendingActions }} action(s) en attente
          </small>

          <small *ngIf="lastSync" class="text-muted d-block">
            Dernière synchro: {{ lastSync | date:'HH:mm' }}
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #28a745;
      transition: all 0.3s ease;
    }

    .status-indicator.syncing {
      background-color: #ffc107;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .sync-status.syncing {
      font-weight: 500;
    }
  `]
})
export class SyncStatusComponent implements OnInit {
  isSyncing = false;
  pendingActions = 0;
  lastSync?: Date;
  isOnline = navigator.onLine;

  constructor(private syncService: SyncService) {}

  ngOnInit(): void {
    // S'abonner au statut de synchronisation
    this.syncService.syncStatus$.subscribe(status => {
      this.isSyncing = status.isSyncing;
      this.pendingActions = status.pendingActions;
      this.lastSync = status.lastSync;
    });

    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      this.isOnline = true;
      // Tenter une synchronisation automatique
      if (this.pendingActions > 0) {
        this.syncService.syncAll();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  getStatusText(): string {
    if (this.isSyncing) return 'Synchronisation...';
    if (!this.isOnline) return 'Hors ligne';
    if (this.pendingActions > 0) return 'En attente de sync';
    return 'Synchronisé';
  }
}
