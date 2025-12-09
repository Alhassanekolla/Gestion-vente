import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OfflineInterceptor } from './offline.interceptor';

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: OfflineInterceptor, multi: true }
];
