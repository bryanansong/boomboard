/**
 * Core authentication type definitions.
 * Provides strict TypeScript types for auth state and user roles.
 */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  role: UserRole;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}
