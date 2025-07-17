import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SignupComponent } from './components/signup/signup.component';
import { SigninComponent } from './components/signin/signin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SpendRatioComponent } from './components/Spend-ratio/spend-ratio.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Default route to homepage
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SigninComponent },
  { 
    path: 'spend-ratio',
    // component: SpendRatioComponent,
    loadComponent:()=>import('./components/Spend-ratio/spend-ratio.component').then(m=>m.SpendRatioComponent),
     canActivate: [AuthGuard] 
  }, 
  { 
    path: 'dashboard',
    //  component: DashboardComponent ,
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  }, 
  
  { 
    path: 'profile',
    //  component: ProfileComponent ,
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
      canActivate: [AuthGuard] 
    }, // Profile route with AuthGuard
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Wildcard route redirects to homepage
];
