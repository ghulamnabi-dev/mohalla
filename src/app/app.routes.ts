import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign in · Mohalla',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
    title: 'Create account · Mohalla',
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Dashboard · Mohalla', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'residents', title: 'Residents · Mohalla', loadComponent: () => import('./features/residents/residents.component').then((m) => m.ResidentsComponent) },
      { path: 'funds', title: 'Contributions · Mohalla', loadComponent: () => import('./features/funds/funds.component').then((m) => m.FundsComponent) },
      { path: 'expenses', title: 'Expenses · Mohalla', loadComponent: () => import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent) },
      { path: 'summary', title: 'Monthly ledger · Mohalla', loadComponent: () => import('./features/summary/summary.component').then((m) => m.SummaryComponent) },
    ],
  },
  // Legacy paths from the first version of the app
  { path: 'home', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' },
];
