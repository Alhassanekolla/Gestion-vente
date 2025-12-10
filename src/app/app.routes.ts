import { Routes } from '@angular/router';
import { ProductListComponent } from './features/products/pages/product-list/product-list.component';
import { CartPageComponent } from './features/cart/pages/cart-page/cart-page.component';
import { OfflineInfoComponent } from './features/offline/pages/offline-info/offline-info.component';
import { SyncTestComponent } from './features/sync/pages/sync-test/sync-test.component';

export const routes: Routes = [
  {path:'',redirectTo:'/products',pathMatch:'full'},
  {
    path:'products',
    component:ProductListComponent,
    title:"Liste des produits"
  },
  {
    path:'cart',
    component:CartPageComponent,
    title:"Etat du panier"
  },
  {
    path:'offline-info',
    component:OfflineInfoComponent
  },
  {
    path:'sync-test',
    component:SyncTestComponent
  }
];
