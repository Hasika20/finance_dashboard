
import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { UpdateRoleInput, UpdateStatusInput } from './users.validator';
import { PaginationParams, createPaginationMeta } from '../../utils/pagination';

/**
 * Gets all users with pagination.
 */
export async function getAllUsers(pagination: PaginationParams) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.user.count(),
  ]);

  const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

  return { users, pagination: paginationMeta };
}

/**
 * Gets a single user by ID.
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { records: true },
      },
    },
  });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return user;
}

/**
 * Updates a user's role.
 * Prevents admin from changing their own role (safety measure).
 * Logs the action to audit trail.
 */
export async function updateUserRole(
  targetUserId: string,
  input: UpdateRoleInput,
  performedByUserId: string
) {
  if (targetUserId === performedByUserId) {
    throw AppError.badRequest('You cannot change your own role');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw AppError.notFound('User not found');
  }

  const oldRole = targetUser.role;

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: input.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: performedByUserId,
      action: 'USER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: targetUserId,
      details: JSON.stringify({
        oldRole,
        newRole: input.role,
        targetUserEmail: targetUser.email,
      }),
    },
  });

  return updatedUser;
}

/**
 * Updates a user's active status (activate/deactivate).
 * Prevents admin from deactivating themselves.
 * Logs the action to audit trail.
 */
export async function updateUserStatus(
  targetUserId: string,
  input: UpdateStatusInput,
  performedByUserId: string
) {
  if (targetUserId === performedByUserId && !input.isActive) {
    throw AppError.badRequest('You cannot deactivate your own account');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw AppError.notFound('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: input.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: performedByUserId,
      action: input.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: targetUserId,
      details: JSON.stringify({
        targetUserEmail: targetUser.email,
      }),
    },
  });

  return updatedUser;
}
