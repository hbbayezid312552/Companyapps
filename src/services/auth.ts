import { AdminUser, AuthSession } from '../types/auth';

const STORAGE_KEY_ADMIN = 'sim_admin_user';
const STORAGE_KEY_SESSION = 'sim_auth_session';

// Cryptographic SHA-256 with salt using Web Crypto API (supported in all modern browsers and Android webviews)
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:SIM_SECURE_SALT_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Initialize Admin if not present
export async function getOrInitAdmin(): Promise<AdminUser> {
  const existing = localStorage.getItem(STORAGE_KEY_ADMIN);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // Fallback
    }
  }

  // Initial admin setup with secure salt & hash (never plain text password)
  const salt = generateSalt();
  // Default password "admin123" securely hashed
  const passwordHash = await hashPassword('admin123', salt);
  const defaultAdmin: AdminUser = {
    id: 'admin_master_1',
    email: 'admin@company.com',
    name: 'Chief Administrator',
    role: 'admin',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(defaultAdmin));
  return defaultAdmin;
}

export async function loginAdmin(email: string, password: string): Promise<AuthSession | null> {
  const admin = await getOrInitAdmin();
  if (admin.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return null;
  }

  const computedHash = await hashPassword(password, admin.salt);
  if (computedHash !== admin.passwordHash) {
    return null;
  }

  // Login successful
  const session: AuthSession = {
    token: `sim_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin',
    },
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days session
  };

  admin.lastLogin = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(admin));
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));

  return session;
}

export function getCurrentSession(): AuthSession | null {
  const sessionStr = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!sessionStr) return null;
  try {
    const session: AuthSession = JSON.parse(sessionStr);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      logoutAdmin();
      return null;
    }
    return session;
  } catch {
    logoutAdmin();
    return null;
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem(STORAGE_KEY_SESSION);
}

export async function updateAdminCredentials(
  newEmail: string,
  newPassword?: string,
  newName?: string,
  currentPassword?: string
): Promise<{ success: boolean; message: string }> {
  const admin = await getOrInitAdmin();

  if (currentPassword) {
    const checkHash = await hashPassword(currentPassword, admin.salt);
    if (checkHash !== admin.passwordHash) {
      return { success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়!' };
    }
  }

  if (newEmail && newEmail.trim()) {
    admin.email = newEmail.trim();
  }

  if (newName && newName.trim()) {
    admin.name = newName.trim();
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword.trim(), newSalt);
    admin.salt = newSalt;
    admin.passwordHash = newHash;
  }

  localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(admin));

  // Update current session if active
  const current = getCurrentSession();
  if (current) {
    current.user.email = admin.email;
    current.user.name = admin.name;
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(current));
  }

  return { success: true, message: 'অ্যাডমিন তথ্য সফলভাবে আপডেট হয়েছে।' };
}
