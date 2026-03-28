import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/player/player.component').then((m) => m.PlayerComponent),
  },
  {
    path: 'channels',
    loadComponent: () =>
      import('./features/channels/channels.component').then((m) => m.ChannelsComponent),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./features/requests/requests.component').then((m) => m.RequestsComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
