
import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { sendSuccess } from '../../utils/response';

/**
 * GET /api/dashboard/summary
 * Returns total income, expenses, net balance, counts.
 */
export async function getSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await dashboardService.getSummary();

    sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/categories
 * Returns category-wise breakdown with percentages.
 */
export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.query.type as string | undefined;
    const categories = await dashboardService.getCategoryBreakdown(type);

    sendSuccess(res, categories, 'Category breakdown retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/trends
 * Returns monthly income vs expense trends for last 12 months.
 */
export async function getTrends(_req: Request, res: Response, next: NextFunction) {
  try {
    const trends = await dashboardService.getMonthlyTrends();

    sendSuccess(res, trends, 'Monthly trends retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/recent
 * Returns recent transactions.
 */
export async function getRecent(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recent = await dashboardService.getRecentActivity(limit);

    sendSuccess(res, recent, 'Recent activity retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/health-score
 * Returns financial health score (0-100) with insights.
 */
export async function getHealthScore(_req: Request, res: Response, next: NextFunction) {
  try {
    const healthScore = await dashboardService.getHealthScore();

    sendSuccess(res, healthScore, 'Financial health score calculated successfully');
  } catch (error) {
    next(error);
  }
}
