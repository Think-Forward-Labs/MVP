// Application-wide types for Think Forward platform

export interface User {
  email: string;
  name: string;
}

export type AppView = 'landing' | 'dashboard';

export type DashboardSection =
  | 'overview'
  | 'interviews'
  | 'documents'
  | 'integrations'
  | 'analysis'
  | 'settings';

export type AuthMode = 'login' | 'signup';
