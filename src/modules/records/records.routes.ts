
import { Router } from 'express';
import * as recordsController from './records.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createRecordSchema,
  updateRecordSchema,
  recordFilterSchema,
  recordIdParamSchema,
} from './records.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/records:
 *   post:
 *     tags: [Financial Records]
 *     summary: Create a new financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: "Salary"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-15T00:00:00.000Z"
 *               description:
 *                 type: string
 *                 example: "Monthly salary payment"
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin only
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate(createRecordSchema),
  recordsController.createRecord
);

/**
 * @openapi
 * /api/records:
 *   get:
 *     tags: [Financial Records]
 *     summary: List records with filters and pagination
 *     description: Available to all authenticated users. Supports filtering by type, category, date range, amount range, and keyword search.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in description field
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, category, createdAt]
 *           default: date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Records retrieved successfully
 */
router.get(
  '/',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(recordFilterSchema, 'query'),
  recordsController.getRecords
);

/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     tags: [Financial Records]
 *     summary: Get a single record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record retrieved successfully
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(recordIdParamSchema, 'params'),
  recordsController.getRecordById
);

/**
 * @openapi
 * /api/records/{id}:
 *   patch:
 *     tags: [Financial Records]
 *     summary: Update a financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         description: Record not found
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(recordIdParamSchema, 'params'),
  validate(updateRecordSchema),
  recordsController.updateRecord
);

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     tags: [Financial Records]
 *     summary: Soft delete a record (Admin only)
 *     description: Marks the record as deleted without permanent removal. Can be restored later.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(recordIdParamSchema, 'params'),
  recordsController.deleteRecord
);

/**
 * @openapi
 * /api/records/{id}/restore:
 *   patch:
 *     tags: [Financial Records]
 *     summary: Restore a soft-deleted record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record restored successfully
 *       404:
 *         description: Deleted record not found
 */
router.patch(
  '/:id/restore',
  authorize('ADMIN'),
  validate(recordIdParamSchema, 'params'),
  recordsController.restoreRecord
);

export default router;
