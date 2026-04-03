
import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get financial summary
 *     description: Returns total income, total expenses, net balance, and record counts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpense:
 *                       type: number
 *                     netBalance:
 *                       type: number
 *                     totalRecords:
 *                       type: integer
 */
router.get(
  '/summary',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  dashboardController.getSummary
);

/**
 * @openapi
 * /api/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown
 *     description: Returns category-wise totals with percentage of total. Optionally filter by type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Category breakdown retrieved successfully
 */
router.get(
  '/categories',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  dashboardController.getCategories
);

/**
 * @openapi
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly trends (Analyst & Admin only)
 *     description: Returns income vs expense comparison for each of the last 12 months
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends retrieved successfully
 *       403:
 *         description: Requires ANALYST or ADMIN role
 */
router.get(
  '/trends',
  authorize('ANALYST', 'ADMIN'),
  dashboardController.getTrends
);

/**
 * @openapi
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent transactions
 *     description: Returns the most recent financial transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get(
  '/recent',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  dashboardController.getRecent
);

/**
 * @openapi
 * /api/dashboard/health-score:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get financial health score (Analyst & Admin only)
 *     description: |
 *       Calculates a financial health score (0-100) based on the income-to-expense ratio.
 *       Returns the score, status, actionable message, and spending insights.
 *       
 *       Scoring: 90-100 Excellent, 70-89 Good, 50-69 Fair, 25-49 Poor, 0-24 Critical
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health score calculated successfully
 *       403:
 *         description: Requires ANALYST or ADMIN role
 */
router.get(
  '/health-score',
  authorize('ANALYST', 'ADMIN'),
  dashboardController.getHealthScore
);

export default router;
