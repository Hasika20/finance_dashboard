
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';

/**
 * Creates an authorization middleware that checks if the authenticated
 * user has one of the allowed roles.
 *
 * @param allowedRoles - Roles that are permitted to access this route
 * @returns Express middleware function
 *
 * @example
 * // Only admins can access
 * router.post('/records', authenticate, authorize('ADMIN'), createRecord);
 *
 * // Analysts and admins can access
 * router.get('/trends', authenticate, authorize('ANALYST', 'ADMIN'), getTrends);
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!res.locals.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    const userRole = res.locals.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        AppError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`
        )
      );
    }

    next();
  };
}
