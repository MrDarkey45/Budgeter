import { getAll, getOne } from '../db/database';
import type { Category } from './categories';

export interface SpendingReport {
  category: Category;
  total: number;
  percentage: number;
}

export interface TrendReport {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface SpendingRow {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  total: number;
}

export const reportsModel = {
  getSpendingByCategory(startDate: string, endDate: string): SpendingReport[] {
    const rows = getAll<SpendingRow>(`
      SELECT
        c.id, c.name, c.type, c.color,
        COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
        AND t.date >= ? AND t.date <= ?
        AND t.type = 'expense'
      WHERE c.type = 'expense'
      GROUP BY c.id
      HAVING total > 0
      ORDER BY total DESC
    `, [startDate, endDate]);

    const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

    return rows.map((row) => ({
      category: {
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
      },
      total: row.total,
      percentage: grandTotal > 0 ? (row.total / grandTotal) * 100 : 0,
    }));
  },

  getMonthlyTrends(months: number): TrendReport[] {
    const trends: TrendReport[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.toISOString().slice(0, 7);
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      const income = getOne<{ total: number }>(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE type = 'income' AND date >= ? AND date <= ?
      `, [startDate, endDate]);

      const expenses = getOne<{ total: number }>(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE type = 'expense' AND date >= ? AND date <= ?
      `, [startDate, endDate]);

      trends.push({
        month,
        income: income?.total || 0,
        expenses: expenses?.total || 0,
        savings: (income?.total || 0) - (expenses?.total || 0),
      });
    }

    return trends;
  },
};
