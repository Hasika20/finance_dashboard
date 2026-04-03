
import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN'], {
    message: 'Role must be VIEWER, ANALYST, or ADMIN',
  }),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean({
    message: 'isActive is required and must be a boolean',
  }),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
