import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncService } from '../../../core/services/sync/sync.service';
import { OfflineManagerService } from '../../../core/services/offline/offline-manager.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center border rounded p-2 bg-light">
      <div class="me-2">
        <i class="bi"
           [class.bi-cloud-check]="!syncing && queue === 0"
           [class.bi-cloud-arrow-up]="!syncing && queue > 0"
           [class.bi-arrow-repeat]="syncing"
           [class.spin]="syncing"
           [class.text-success]="!syncing && queue === 0"
           [class.text-warning]="!syncing && queue > 0"
           [class.text-primary]="syncing">
        </i>
      </div>

      <div class="me-3">
        <div class="small">
          <span *ngIf="syncing">Synchronisation...</span>
          <span *ngIf="!syncing && queue === 0">Prêt</span>
          <span *ngIf="!syncing && queue > 0" class="text-warning">
            {{ queue }} en attente
          </span>
        </div>
        <div class="text-muted small" *ngIf="lastSync">
          {{ lastSync | date:'HH:mm' }}
        </div>
      </div>

      <button class="btn btn-sm btn-outline-primary"
              [disabled]="syncing || !online"
              (click)="startSync()">
        <i class="bi bi-arrow-repeat"></i>
      </button>
    </div>
  `,
  styles: [`
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SyncStatusComponent implements OnInit {
  syncing = false;
  queue = 0;
  lastSync: Date | null = null;
  online = navigator.onLine;

  constructor(
    private syncService: SyncService,
    private offlineService: OfflineManagerService
  ) {}

  ngOnInit() {
    this.syncService.isSyncing$.subscribe(state => {
      this.syncing = state;
    });

    this.offlineService.getQueue().then(actions => {
      this.queue = actions.length;
    });

    window.addEventListener('online', () => {
      this.online = true;
    });

    window.addEventListener('offline', () => {
      this.online = false;
    });
  }

  async startSync() {
    if (!this.online) {
      alert('Hors ligne - impossible de sync');
      return;
    }

    try {
      await this.syncService.sync();
      this.lastSync = new Date();

      const actions = await this.offlineService.getQueue();
      this.queue = actions.length;
    } catch (error) {
      console.log('Erreur sync', error);
    }
  }
}
