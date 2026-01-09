import { getAll, getOne, runQuery, insertAndGetId } from '../db/database';
import type { Category } from './categories';

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
  category?: Category;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  category_id?: number;
  type?: 'income' | 'expense';
}

interface TransactionRow extends Transaction {
  category: string;
}

export const transactionsModel = {
  getAll(filters: TransactionFilters = {}): Transaction[] {
    let query = `
      SELECT t.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (filters.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }
    if (filters.category_id) {
      query += ' AND t.category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.type) {
      query += ' AND t.type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY t.date DESC, t.id DESC';

    const rows = getAll<TransactionRow>(query, params);
    return rows.map((row) => ({
      ...row,
      category: row.category ? JSON.parse(row.category) : undefined,
    }));
  },

  getById(id: number): Transaction | undefined {
    const row = getOne<TransactionRow>(`
      SELECT t.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [id]);

    if (!row) return undefined;
    return { ...row, category: row.category ? JSON.parse(row.category) : undefined };
  },

  create(data: Omit<Transaction, 'id' | 'created_at' | 'category'>): Transaction {
    const id = insertAndGetId(`
      INSERT INTO transactions (amount, description, category_id, date, type)
      VALUES (?, ?, ?, ?, ?)
    `, [data.amount, data.description, data.category_id, data.date, data.type]);
    return this.getById(id)!;
  },

  update(id: number, data: Partial<Omit<Transaction, 'id' | 'created_at' | 'category'>>): Transaction | undefined {
    const current = this.getById(id);
    if (!current) return undefined;

    const updated = {
      amount: data.amount ?? current.amount,
      description: data.description ?? current.description,
      category_id: data.category_id ?? current.category_id,
      date: data.date ?? current.date,
      type: data.type ?? current.type,
    };

    runQuery(`
      UPDATE transactions
      SET amount = ?, description = ?, category_id = ?, date = ?, type = ?
      WHERE id = ?
    `, [updated.amount, updated.description, updated.category_id, updated.date, updated.type, id]);

    return this.getById(id);
  },

  delete(id: number): boolean {
    const before = this.getById(id);
    if (!before) return false;
    runQuery('DELETE FROM transactions WHERE id = ?', [id]);
    return true;
  },

  getMonthlyTotals(month: string): { income: number; expenses: number } {
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

    return { income: income?.total || 0, expenses: expenses?.total || 0 };
  },

  getRecent(limit: number = 10): Transaction[] {
    const rows = getAll<TransactionRow>(`
      SELECT t.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.id DESC
      LIMIT ?
    `, [limit]);

    return rows.map((row) => ({
      ...row,
      category: row.category ? JSON.parse(row.category) : undefined,
    }));
  },
};
