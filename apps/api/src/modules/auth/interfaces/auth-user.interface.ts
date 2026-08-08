export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  avatarUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
  sessionId?: string;
}
export interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}
export interface JwtPayload {
  id: string;
  sub: string;
  email: string;
  roles: string[];
  sid?: string;
  type: 'access' | 'refresh';
  jti?: string;
}
