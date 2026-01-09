import { getAll, getOne, runQuery } from '../db/database';
import type { Category } from './categories';

export interface Budget {
  id: number;
  category_id: number;
  amount: number;
  month: string;
  category?: Category;
}

export interface BudgetSummary {
  category: Category;
  budget_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface BudgetRow extends Budget {
  category: string;
}

interface SummaryRow {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  budget_amount: number;
  spent: number;
}

export const budgetsModel = {
  getByMonth(month: string): Budget[] {
    const rows = getAll<BudgetRow>(`
      SELECT b.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.month = ?
    `, [month]);

    return rows.map((row) => ({
      ...row,
      category: row.category ? JSON.parse(row.category) : undefined,
    }));
  },

  setBudget(data: { category_id: number; amount: number; month: string }): Budget {
    runQuery(`
      INSERT INTO budgets (category_id, amount, month)
      VALUES (?, ?, ?)
      ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount
    `, [data.category_id, data.amount, data.month]);

    const budget = getOne<BudgetRow>(`
      SELECT b.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.category_id = ? AND b.month = ?
    `, [data.category_id, data.month])!;

    return {
      ...budget,
      category: budget.category ? JSON.parse(budget.category) : undefined,
    };
  },

  getSummary(month: string): BudgetSummary[] {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const rows = getAll<SummaryRow>(`
      SELECT
        c.id, c.name, c.type, c.color,
        COALESCE(b.amount, 0) as budget_amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM categories c
      LEFT JOIN budgets b ON c.id = b.category_id AND b.month = ?
      LEFT JOIN transactions t ON c.id = t.category_id AND t.date >= ? AND t.date <= ? AND t.type = 'expense'
      WHERE c.type = 'expense'
      GROUP BY c.id
      HAVING budget_amount > 0 OR spent > 0
    `, [month, startDate, endDate]);

    return rows.map((row) => ({
      category: {
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
      },
      budget_amount: row.budget_amount,
      spent: row.spent,
      remaining: row.budget_amount - row.spent,
      percentage: row.budget_amount > 0 ? (row.spent / row.budget_amount) * 100 : 0,
    }));
  },
};
