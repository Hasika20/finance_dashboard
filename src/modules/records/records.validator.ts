
import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z
    .number({ message: 'Amount is required and must be a number' })
    .positive('Amount must be greater than 0'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    message: 'Type must be INCOME or EXPENSE',
  }),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be at most 50 characters')
    .trim(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .transform((val) => new Date(val)),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
});

export const updateRecordSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .optional(),
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
    })
    .optional(),
  category: z
    .string()
    .min(1)
    .max(50)
    .trim()
    .optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .transform((val) => new Date(val))
    .optional(),
  description: z
    .string()
    .max(500)
    .trim()
    .optional()
    .nullable(),
});

export const recordFilterSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'category', 'createdAt']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const recordIdParamSchema = z.object({
  id: z.string().uuid('Invalid record ID format'),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordFilterInput = z.infer<typeof recordFilterSchema>;
