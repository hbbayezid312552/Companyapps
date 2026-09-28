export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  passwordHash: string; // SHA-256 hash with salt
  salt: string;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin';
  };
  expiresAt: number;
}
