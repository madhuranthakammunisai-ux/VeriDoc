import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyAuthToken, createScopedClient } from '../config/supabase.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Bearer token not provided');
    }

    // Verify token with Supabase Auth
    const user = await verifyAuthToken(token);

    // Attach user, raw token, and scoped Supabase client with RLS
    req.user = user;
    req.token = token;
    req.supabase = createScopedClient(token);

    next();
  } catch (error: any) {
    logger.warn('Authentication failed', { error: error.message });
    next(new UnauthorizedError(error.message || 'Authentication failed'));
  }
}

