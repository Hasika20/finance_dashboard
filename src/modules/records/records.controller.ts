
import { Request, Response, NextFunction } from 'express';
import * as recordsService from './records.service';
import { sendSuccess } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

/**
 * POST /api/records
 * Creates a new financial record (Admin only).
 */
export async function createRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.createRecord(req.body, res.locals.user.id);

    sendSuccess(res, record, 'Record created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/records
 * Lists financial records with filters and pagination (All roles).
 */
export async function getRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = getPaginationParams(req.query as { page?: string; limit?: string });
    const result = await recordsService.getRecords(req.query as any, pagination);

    sendSuccess(res, result.records, 'Records retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/records/:id
 * Gets a single financial record by ID (All roles).
 */
export async function getRecordById(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.getRecordById(String(req.params.id));

    sendSuccess(res, record, 'Record retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/records/:id
 * Updates a financial record (Admin only).
 */
export async function updateRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.updateRecord(
      String(req.params.id),
      req.body,
      res.locals.user.id
    );

    sendSuccess(res, record, 'Record updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/records/:id
 * Soft deletes a financial record (Admin only).
 */
export async function deleteRecord(req: Request, res: Response, next: NextFunction) {
  try {
    await recordsService.deleteRecord(String(req.params.id), res.locals.user.id);

    sendSuccess(res, null, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/records/:id/restore
 * Restores a soft-deleted record (Admin only).
 */
export async function restoreRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recordsService.restoreRecord(String(req.params.id), res.locals.user.id);

    sendSuccess(res, record, 'Record restored successfully');
  } catch (error) {
    next(error);
  }
}
