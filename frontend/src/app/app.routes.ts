import { Routes } from '@angular/router';
  import { SignupComponent } from './components/signup/signup.component';
  import { SigninComponent } from './components/signin/signin.component';
  import { DashboardComponent } from './components/dashboard/dashboard.component';
  import { ProfileComponent } from './components/profile/profile.component';
  import { SpendRatioComponent } from './components/Spend-ratio/spend-ratio.component';
  export const routes: Routes = [
    { path: 'signup', component: SignupComponent },
    { path: 'signin', component: SigninComponent },
    { path: 'spend-ratio', component: SpendRatioComponent  },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'profile', component: ProfileComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  ];