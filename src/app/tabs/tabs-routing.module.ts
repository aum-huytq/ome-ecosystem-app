import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../core/guards/auth-guard'; // đúng path file guard của bạn

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      // HOME / CATALOG
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadChildren: () =>
          import('../features/catalog/home/home.module').then(
            m => m.HomePageModule,
          ),
      },
      {
        // URL SEO cho sản phẩm: /product/:slug  (hoặc :id)
        path: 'product/:slug',
        loadChildren: () =>
          import('../features/catalog/product-detail/product-detail.module').then(
            m => m.ProductDetailPageModule,
          ),
      },

      // CART & CHECKOUT
      {
        path: 'cart',
        loadChildren: () =>
          import('../features/checkout/cart/cart.module').then(
            m => m.CartPageModule,
          ),
      },
      {
        path: 'checkout',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../features/checkout/checkout/checkout.module').then(
            m => m.CheckoutPageModule,
          ),
      },

      // PROFILE
      {
        path: 'profile',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../features/profile/profile/profile.module').then(
            m => m.ProfilePageModule,
          ),
      },
      {
        path: 'addresses',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../features/profile/addresses/addresses.module').then(
            m => m.AddressesPageModule,
          ),
      },

      // ORDERS
      {
        path: 'orders',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../features/orders/order-list/order-list.module').then(
            m => m.OrderListPageModule,
          ),
      },
      {
        path: 'orders/:id',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../features/orders/order-detail/order-detail.module').then(
            m => m.OrderDetailPageModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
