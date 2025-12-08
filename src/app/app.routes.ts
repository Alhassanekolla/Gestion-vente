import { Routes } from '@angular/router';
import { ProductListComponent } from './features/products/pages/product-list/product-list.component';
import { CartListComponent } from './features/cart/pages/cart-list/cart-list.component';

export const routes: Routes = [
  {path:'',redirectTo:'/products',pathMatch:'full'},
  {
    path:'products',
    component:ProductListComponent,
    title:"Liste des produits"
  },
  {
    path:'cart',
    component:CartListComponent,
    title:"Etat du panier"
  }
];
