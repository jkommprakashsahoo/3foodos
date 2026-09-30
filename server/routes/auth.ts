// FoodWise AI - Authentication Routes & Authorization Middleware
// Multi-role RBAC: Kitchen Manager, Kitchen Staff, Receiver, Admin

import { Request, Response, NextFunction, Router } from 'express';
import {
  createUser,
  findUserByEmail,
  findUserById,
  getDatabaseStatus,
  type DbUser
} from '../db/index.ts';
import {
  generateToken,
  hashPassword,
  verifyPassword,
  verifyToken
} from '../services/auth.ts';
import { UserRole } from '../../src/types.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organization_id: string;
    name: string;
  };
}

const authRouter = Router();

function authConfigurationUnavailable(res: Response, action: 'Account creation' | 'Sign-in' | 'Session verification') {
  const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (!isProductionRuntime) return false;

  const databaseReady = process.env.VERCEL !== '1' || getDatabaseStatus().connected;
  const tokenSigningReady = Boolean(process.env.JWT_SECRET);
  if (databaseReady && tokenSigningReady) return false;

  const error = !databaseReady
    ? `${action} is unavailable because this deployment has no connected persistent database.`
    : `${action} is unavailable because the JWT_SECRET is not configured for this deployment.`;
  res.status(503).json({
    success: false,
    error: `${error} Contact the workspace administrator.`,
    code: databaseReady ? 'AUTH_CONFIGURATION_MISSING' : 'AUTH_STORAGE_UNAVAILABLE'
  });
  return true;
}

// ----------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------------------------
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to access this resource.',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid token. Please log in again.',
      code: 'INVALID_TOKEN'
    });
  }

  req.user = payload;
  next();
}

// Optional Auth (populates req.user if token present, but doesn't block)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: "${req.user.role}".`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

// ----------------------------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------------------------

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || !normalizedEmail || typeof password !== 'string' || !role) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, password, role.',
        code: 'MISSING_FIELDS'
      });
    }

    const validRoles: UserRole[] = ['Kitchen Manager', 'Kitchen Staff', 'Receiver'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role "${role}". Choose Kitchen Manager, Kitchen Staff, or Receiver.`,
        code: 'INVALID_ROLE'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Enter a valid email address.',
        code: 'INVALID_EMAIL'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters.',
        code: 'WEAK_PASSWORD'
      });
    }

    if (authConfigurationUnavailable(res, 'Account creation')) return;

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email is already registered.',
        code: 'EMAIL_IN_USE'
      });
    }

    const { hash, salt } = hashPassword(password);
    const newUser = await createUser({
      name: normalizedName,
      email: normalizedEmail,
      password_hash: hash,
      salt,
      role,
      organization_id: 'org-central-04'
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      organization_id: newUser.organization_id,
      name: newUser.name
    });

    return res.status(201).json({
      success: true,
      message: 'User account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization_id: newUser.organization_id
      }
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'An account with this email is already registered.',
        code: 'EMAIL_IN_USE'
      });
    }
    console.error('[Auth] Account registration failed:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to create your account right now. Please try again or contact the workspace administrator.',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (authConfigurationUnavailable(res, 'Sign-in')) return;

    const user = await findUserByEmail(typeof email === 'string' ? email.trim().toLowerCase() : '');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = verifyPassword(password, user.password_hash, user.salt);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      name: user.name
    });

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });
  } catch (err: any) {
    console.error('[Auth] Sign-in failed:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to sign in right now. Please try again or contact the workspace administrator.',
      code: 'SIGN_IN_FAILED'
    });
  }
});

// GET /api/auth/me
authRouter.get(
  '/me',
  (req, res, next) => {
    if (authConfigurationUnavailable(res, 'Session verification')) return;
    next();
  },
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id
        }
      });
    } catch (err) {
      console.error('[Auth] Session verification failed:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to verify your session right now. Please try again.',
        code: 'SESSION_VERIFICATION_FAILED'
      });
    }
  }
);

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

export default authRouter;
