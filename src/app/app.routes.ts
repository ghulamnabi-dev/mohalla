import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign in · SMS',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
    title: 'Create account · SMS',
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Dashboard · SMS', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'residents', title: 'Residents · SMS', loadComponent: () => import('./features/residents/residents.component').then((m) => m.ResidentsComponent) },
      { path: 'funds', title: 'Contributions · SMS', loadComponent: () => import('./features/funds/funds.component').then((m) => m.FundsComponent) },
      { path: 'expenses', title: 'Expenses · SMS', loadComponent: () => import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent) },
      { path: 'summary', title: 'Monthly ledger · SMS', loadComponent: () => import('./features/summary/summary.component').then((m) => m.SummaryComponent) },
    ],
  },
  // Legacy paths from the first version of the app
  { path: 'home', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' },
];
