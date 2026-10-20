import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dawnexus_social_jwt_production_secret_32chars_long_key_2026';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  workspaceId?: string;
  workspaceRole?: 'owner' | 'admin' | 'editor' | 'viewer';
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// Authentication middleware
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  // 1. Check Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Check Cookie
  if (!token && req.cookies && req.cookies.dawnexus_social_token) {
    token = req.cookies.dawnexus_social_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    // Verify user exists in social_profiles
    const result = await query(
      'SELECT id, email, full_name, avatar_url FROM social_profiles WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User profile not found or revoked.' });
      return;
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      fullName: result.rows[0].full_name,
      avatarUrl: result.rows[0].avatar_url,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

// Strict Multi-Tenant Workspace Authorization Middleware
export function requireWorkspaceAccess(allowedRoles: ('owner' | 'admin' | 'editor' | 'viewer')[] = ['owner', 'admin', 'editor', 'viewer']) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const workspaceId = req.params.workspaceId || req.body.workspaceId || (req.query.workspaceId as string);
    if (!workspaceId) {
      res.status(400).json({ error: 'Workspace ID must be specified.' });
      return;
    }

    try {
      const membershipRes = await query(
        `SELECT role FROM social_workspace_members WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, req.user.id]
      );

      if (membershipRes.rows.length === 0) {
        res.status(403).json({ error: 'Access denied: You are not a member of this workspace.' });
        return;
      }

      const role = membershipRes.rows[0].role;
      if (!allowedRoles.includes(role)) {
        res.status(403).json({ error: `Insufficient permissions. Role '${role}' cannot perform this action.` });
        return;
      }

      req.workspaceId = workspaceId;
      req.workspaceRole = role;
      next();
    } catch (err: any) {
      console.error('[Workspace Auth Error]', err);
      res.status(500).json({ error: 'Failed to verify workspace permissions.' });
    }
  };
}
