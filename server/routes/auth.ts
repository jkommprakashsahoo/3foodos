// FoodWise AI - Authentication Routes & Authorization Middleware
// Multi-role RBAC: Kitchen Manager, Kitchen Staff, Receiver, Admin

import { Request, Response, NextFunction, Router } from 'express';
import {
  createUser,
  findUserByEmail,
  findUserById,
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
    const { name, email, password, role, organization_id } = req.body;

    // Missing fields validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, password, role.',
        code: 'MISSING_FIELDS'
      });
    }

    const validRoles: UserRole[] = ['Kitchen Manager', 'Kitchen Staff', 'Receiver', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role "${role}". Allowed roles: ${validRoles.join(', ')}`,
        code: 'INVALID_ROLE'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
        code: 'WEAK_PASSWORD'
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `User with email "${email}" is already registered.`,
        code: 'EMAIL_IN_USE'
      });
    }

    const { hash, salt } = hashPassword(password);
    const newUser = await createUser({
      name,
      email,
      password_hash: hash,
      salt,
      role,
      organization_id: organization_id || 'org-central-04'
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
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const user = await findUserByEmail(email);
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
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

export default authRouter;
