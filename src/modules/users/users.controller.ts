
import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { sendSuccess } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

/**
 * GET /api/users
 * Lists all users with pagination. Admin only.
 */
export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = getPaginationParams(req.query as { page?: string; limit?: string });
    const result = await usersService.getAllUsers(pagination);

    sendSuccess(res, result.users, 'Users retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id
 * Gets a single user by ID. Admin only.
 */
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(String(req.params.id));

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id/role
 * Updates a user's role. Admin only.
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUserRole(
      String(req.params.id),
      req.body,
      res.locals.user.id
    );

    sendSuccess(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id/status
 * Activates or deactivates a user. Admin only.
 */
export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUserStatus(
      String(req.params.id),
      req.body,
      res.locals.user.id
    );

    sendSuccess(
      res,
      user,
      user.isActive ? 'User activated successfully' : 'User deactivated successfully'
    );
  } catch (error) {
    next(error);
  }
}
