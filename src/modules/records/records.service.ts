
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from './records.validator';
import { PaginationParams, createPaginationMeta } from '../../utils/pagination';

/**
 * Creates a new financial record.
 */
export async function createRecord(input: CreateRecordInput, userId: string) {
  const record = await prisma.financialRecord.create({
    data: {
      userId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      description: input.description,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECORD_CREATED',
      entityType: 'RECORD',
      entityId: record.id,
      details: JSON.stringify({
        amount: input.amount,
        type: input.type,
        category: input.category,
      }),
    },
  });

  return record;
}

/**
 * Gets all financial records with dynamic filtering and pagination.
 *
 * Supports filtering by:
 * - type (INCOME/EXPENSE)
 * - category
 * - date range (startDate, endDate)
 * - amount range (minAmount, maxAmount)
 * - keyword search in description
 * - sort by any field
 */
export async function getRecords(filters: RecordFilterInput, pagination: PaginationParams) {
  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null, // Exclude soft-deleted records
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.category) {
    where.category = { contains: filters.category };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      (where.date as Prisma.DateTimeFilter).gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      (where.date as Prisma.DateTimeFilter).lte = new Date(filters.endDate);
    }
  }

  if (filters.minAmount || filters.maxAmount) {
    where.amount = {};
    if (filters.minAmount) {
      (where.amount as Prisma.DecimalFilter).gte = parseFloat(filters.minAmount);
    }
    if (filters.maxAmount) {
      (where.amount as Prisma.DecimalFilter).lte = parseFloat(filters.maxAmount);
    }
  }

  if (filters.search) {
    where.description = { contains: filters.search };
  }

  const orderBy: Prisma.FinancialRecordOrderByWithRelationInput = {
    [filters.sortBy || 'date']: filters.order || 'desc',
  };

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

  return { records, pagination: paginationMeta };
}

/**
 * Gets a single record by ID (excluding soft-deleted).
 */
export async function getRecordById(recordId: string) {
  const record = await prisma.financialRecord.findFirst({
    where: {
      id: recordId,
      deletedAt: null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!record) {
    throw AppError.notFound('Financial record not found');
  }

  return record;
}

/**
 * Updates a financial record (partial update via PATCH).
 */
export async function updateRecord(
  recordId: string,
  input: UpdateRecordInput,
  userId: string
) {
  const existingRecord = await prisma.financialRecord.findFirst({
    where: { id: recordId, deletedAt: null },
  });

  if (!existingRecord) {
    throw AppError.notFound('Financial record not found');
  }

  const updatedRecord = await prisma.financialRecord.update({
    where: { id: recordId },
    data: {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.description !== undefined && { description: input.description }),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECORD_UPDATED',
      entityType: 'RECORD',
      entityId: recordId,
      details: JSON.stringify({
        changes: input,
      }),
    },
  });

  return updatedRecord;
}

/**
 * Soft deletes a financial record (sets deletedAt timestamp).
 * Financial records should never be permanently deleted for audit purposes.
 */
export async function deleteRecord(recordId: string, userId: string) {
  const existingRecord = await prisma.financialRecord.findFirst({
    where: { id: recordId, deletedAt: null },
  });

  if (!existingRecord) {
    throw AppError.notFound('Financial record not found');
  }

  const deletedRecord = await prisma.financialRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECORD_DELETED',
      entityType: 'RECORD',
      entityId: recordId,
      details: JSON.stringify({
        amount: existingRecord.amount,
        type: existingRecord.type,
        category: existingRecord.category,
      }),
    },
  });

  return deletedRecord;
}

/**
 * Restores a soft-deleted financial record.
 */
export async function restoreRecord(recordId: string, userId: string) {
  const existingRecord = await prisma.financialRecord.findFirst({
    where: {
      id: recordId,
      deletedAt: { not: null },
    },
  });

  if (!existingRecord) {
    throw AppError.notFound('Deleted financial record not found');
  }

  const restoredRecord = await prisma.financialRecord.update({
    where: { id: recordId },
    data: { deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECORD_RESTORED',
      entityType: 'RECORD',
      entityId: recordId,
      details: JSON.stringify({
        amount: existingRecord.amount,
        type: existingRecord.type,
        category: existingRecord.category,
      }),
    },
  });

  return restoredRecord;
}
