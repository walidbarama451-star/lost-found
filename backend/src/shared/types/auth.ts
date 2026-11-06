export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}
