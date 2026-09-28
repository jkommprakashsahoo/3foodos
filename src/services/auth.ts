import { get, post } from './apiClient.ts';
import type { UserRole } from '../types.ts';
import type { AuthUser } from '../components/AuthModal.tsx';

interface AuthResponse {
  success: true;
  token: string;
  user: AuthUser;
  message?: string;
}

export function signIn(email: string, password: string) {
  return post<AuthResponse>('/api/auth/login', { email, password });
}

export function registerStaff(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  return post<AuthResponse>('/api/auth/register', input);
}

export function getCurrentUser() {
  return get<{ success: true; user: AuthUser }>('/api/auth/me');
}

export function signOut() {
  localStorage.removeItem('foodwise_auth_token');
}
