
import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

const activeRecordFilter: Prisma.FinancialRecordWhereInput = {
  deletedAt: null,
};

/**
 * SUMMARY ENDPOINT
 * Returns total income, total expenses, net balance, and record count.
 *
 * Uses Prisma's aggregate functions to push calculations to the database
 * instead of loading all records into memory (a common antipattern).
 */
export async function getSummary() {
  const [incomeResult, expenseResult, totalCount] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...activeRecordFilter, type: 'INCOME' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialRecord.aggregate({
      where: { ...activeRecordFilter, type: 'EXPENSE' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialRecord.count({
      where: activeRecordFilter,
    }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount || 0);
  const totalExpense = Number(expenseResult._sum.amount || 0);
  const netBalance = totalIncome - totalExpense;

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    totalRecords: totalCount,
    incomeCount: incomeResult._count,
    expenseCount: expenseResult._count,
  };
}

/**
 * CATEGORY BREAKDOWN ENDPOINT
 * Returns category-wise totals WITH percentage of total.
 *
 * This goes beyond basic "GROUP BY" — it calculates each category's
 * share of overall spending/income, which is what a real dashboard needs.
 */
export async function getCategoryBreakdown(type?: string) {
  const where: Prisma.FinancialRecordWhereInput = { ...activeRecordFilter };
  if (type === 'INCOME' || type === 'EXPENSE') {
    where.type = type;
  }

  const categories = await prisma.financialRecord.groupBy({
    by: ['category'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  const total = categories.reduce((sum, cat) => sum + Number(cat._sum.amount || 0), 0);

  return categories.map((cat) => {
    const amount = Number(cat._sum.amount || 0);
    return {
      category: cat.category,
      amount: Math.round(amount * 100) / 100,
      count: cat._count,
      percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
    };
  });
}

/**
 * MONTHLY TRENDS ENDPOINT
 * Returns income vs expense comparison for each of the last 12 months.
 *
 * Since SQLite doesn't support DATE_TRUNC, we fetch records and
 * group them in JavaScript by year-month. For PostgreSQL, this would
 * use a raw SQL query with DATE_TRUNC for better performance.
 */
export async function getMonthlyTrends() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const records = await prisma.financialRecord.findMany({
    where: {
      ...activeRecordFilter,
      date: { gte: twelveMonthsAgo },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, { income: 0, expense: 0 });
  }

  for (const record of records) {
    const date = new Date(record.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyMap.has(key)) {
      const entry = monthlyMap.get(key)!;
      const amount = Number(record.amount);

      if (record.type === 'INCOME') {
        entry.income += amount;
      } else {
        entry.expense += amount;
      }
    }
  }

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    income: Math.round(data.income * 100) / 100,
    expense: Math.round(data.expense * 100) / 100,
    net: Math.round((data.income - data.expense) * 100) / 100,
  }));
}

/**
 * RECENT ACTIVITY ENDPOINT
 * Returns the last N transactions.
 */
export async function getRecentActivity(limit: number = 10) {
  const records = await prisma.financialRecord.findMany({
    where: activeRecordFilter,
    orderBy: { date: 'desc' },
    take: Math.min(limit, 50), // Cap at 50
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return records;
}

/**
 * FINANCIAL HEALTH SCORE ENDPOINT (Creative differentiator)
 *
 * Calculates a score (0-100) based on income/expense ratio
 * and returns actionable financial insight messages.
 *
 * Scoring Logic:
 * - Score 90-100: Excellent (expenses < 40% of income)
 * - Score 70-89:  Good (expenses 40-60% of income)
 * - Score 50-69:  Fair (expenses 60-80% of income)
 * - Score 25-49:  Poor (expenses 80-100% of income)
 * - Score 0-24:   Critical (expenses > income)
 */
export async function getHealthScore() {
  const summary = await getSummary();
  const categories = await getCategoryBreakdown('EXPENSE');

  const { totalIncome, totalExpense } = summary;

  let score: number;
  let status: string;
  let message: string;

  if (totalIncome === 0 && totalExpense === 0) {
    score = 50;
    status = 'NEUTRAL';
    message = 'No financial data available yet. Start recording your transactions to get insights.';
  } else if (totalIncome === 0) {
    score = 0;
    status = 'CRITICAL';
    message = 'No income recorded. All transactions are expenses. Record your income sources to get accurate insights.';
  } else {
    const expenseRatio = totalExpense / totalIncome;

    if (expenseRatio < 0.4) {
      score = 95;
      status = 'EXCELLENT';
      message = 'Outstanding financial health! You are saving more than 60% of your income. Keep up the great work!';
    } else if (expenseRatio < 0.6) {
      score = 80;
      status = 'GOOD';
      message = 'Good financial balance. You are saving 40-60% of your income. Consider investing your surplus.';
    } else if (expenseRatio < 0.8) {
      score = 60;
      status = 'FAIR';
      message = 'Fair financial health. Your expenses consume 60-80% of income. Look for areas to reduce spending.';
    } else if (expenseRatio < 1.0) {
      score = 35;
      status = 'POOR';
      message = 'High expense ratio detected. Expenses are consuming over 80% of your income. Review discretionary spending.';
    } else {
      score = 10;
      status = 'CRITICAL';
      message = 'Expenses exceed income! You are spending more than you earn. Immediate budget review is recommended.';
    }
  }

  const topExpenseCategory = categories.length > 0 ? categories[0] : null;

  const insights: string[] = [];

  if (topExpenseCategory) {
    insights.push(
      `Your highest expense category is "${topExpenseCategory.category}" at ${topExpenseCategory.percentage}% of total expenses.`
    );
  }

  if (totalIncome > 0 && totalExpense > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    insights.push(
      `Your current savings rate is ${Math.round(savingsRate)}%.`
    );
  }

  if (categories.length > 3) {
    const top3Total = categories.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0);
    insights.push(
      `Your top 3 expense categories account for ${Math.round(top3Total)}% of all expenses.`
    );
  }

  return {
    score,
    status,
    message,
    summary: {
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netBalance: summary.netBalance,
    },
    insights,
    topExpenseCategory: topExpenseCategory
      ? {
          category: topExpenseCategory.category,
          amount: topExpenseCategory.amount,
          percentage: topExpenseCategory.percentage,
        }
      : null,
  };
}
