// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Tất cả app chính (có tab) nằm trong TabsPageModule
  {
    path: '',
    loadChildren: () =>
      import('./tabs/tabs.module').then(m => m.TabsPageModule),
  },

  // ====== AUTH: KHÔNG CÓ TAB BAR ======
  {
    path: 'auth/login',
    loadChildren: () =>
      import('./features/auth/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'auth/forgot-password',
    loadChildren: () =>
      import('./features/auth/forgot-password/forgot-password.module')
        .then(m => m.ForgotPasswordPageModule),
  },
  {
    path: 'auth/otp-verify',
    loadChildren: () =>
      import('./features/auth/otp-verify/otp-verify.module')
        .then(m => m.OtpVerifyPageModule),
  },

  // Fallback: nếu route không khớp thì về home
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
