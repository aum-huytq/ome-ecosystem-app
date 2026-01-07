import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OtpVerifyPage } from './otp-verify.page';

const routes: Routes = [
  {
    path: '',
    component: OtpVerifyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OtpVerifyPageRoutingModule {}
