import { Routes } from '@angular/router';
import { ProductListComponent } from './features/products/pages/product-list/product-list.component';
import { CartPageComponent } from './features/cart/pages/cart-page/cart-page.component';

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
  }
];
