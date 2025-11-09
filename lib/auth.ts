import { NextRequest } from 'next/server';
import { verify, sign } from 'jsonwebtoken';

const SESSION_SECRET = process.env.SESSION_SECRET || 'changeme';

export interface User {
  id: string;
  role: 'admin' | 'analyst' | 'viewer';
  permissions: string[];
}

export interface Session {
  user: User;
  expiresAt: number;
}

// Simple RBAC permissions
const ROLE_PERMISSIONS = {
  admin: ['read:alerts', 'write:alerts', 'read:agents', 'write:agents', 'read:vulnerabilities', 'admin:users'],
  analyst: ['read:alerts', 'read:agents', 'read:vulnerabilities'],
  viewer: ['read:alerts', 'read:agents'],
};

export function createUserSession(user: User): string {
  const session: Session = {
    user,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  return sign(session, SESSION_SECRET);
}

export function verifyUserSession(token: string): Session | null {
  try {
    const session = verify(token, SESSION_SECRET) as Session;

    if (session.expiresAt < Date.now()) {
      return null; // Session expired
    }

    return session;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): User | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const session = verifyUserSession(token);

  return session?.user || null;
}

export function hasPermission(user: User, permission: string): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

export function requirePermission(user: User, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Insufficient permissions: ${permission}`);
  }
}

// Middleware helper
export function withAuth(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const user = getUserFromRequest(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      return await handler(request, user);
    } catch (error: any) {
      if (error.message.startsWith('Insufficient permissions')) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }
  };
}

// Default admin user for demo
export function createDefaultAdmin(): User {
  return {
    id: 'admin',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
  };
}

// Audit logging
export interface AuditLogEntry {
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
}

let auditLogs: AuditLogEntry[] = [];

export function logAuditEntry(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const { insertAuditLog } = require('./db');
  insertAuditLog(entry);
}

export function getAuditLogs(limit: number = 100): AuditLogEntry[] {
  const { getAuditLogs } = require('./db');
  return getAuditLogs(limit);
}

export function createAuditMiddleware(action: string, resource: string) {
  return (request: NextRequest, user: User) => {
    logAuditEntry({
      userId: user.id,
      action,
      resource,
      details: {
        method: request.method,
        url: request.url,
      },
      ipAddress: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown',
    });
  };
}