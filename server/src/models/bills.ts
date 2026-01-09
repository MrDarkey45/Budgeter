import { getAll, getOne, runQuery, insertAndGetId } from '../db/database';
import type { Category } from './categories';

export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  category_id: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  due_day: number;
  is_active: boolean;
  category?: Category;
  next_due_date?: string;
}

export interface BillPayment {
  id: number;
  recurring_bill_id: number | null;
  amount: number;
  paid_date: string;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  recurring_bill?: RecurringBill;
}

interface BillRow extends RecurringBill {
  category: string;
  is_active: number;
}

interface PaymentRow extends BillPayment {
  recurring_bill: string | null;
}

function calculateNextDueDate(dueDay: number, frequency: string): string {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextDate = new Date(currentYear, currentMonth, dueDay);

  // If the due day has passed this month, calculate next occurrence
  if (currentDay > dueDay) {
    if (frequency === 'monthly') {
      nextDate = new Date(currentYear, currentMonth + 1, dueDay);
    } else if (frequency === 'quarterly') {
      nextDate = new Date(currentYear, currentMonth + 3, dueDay);
    } else if (frequency === 'yearly') {
      nextDate = new Date(currentYear + 1, currentMonth, dueDay);
    }
  }

  // Handle months with fewer days
  if (nextDate.getDate() !== dueDay) {
    nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
  }

  return nextDate.toISOString().split('T')[0];
}

export const billsModel = {
  getAll(): RecurringBill[] {
    const rows = getAll<BillRow>(`
      SELECT b.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM recurring_bills b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.due_day
    `);

    return rows.map((row) => ({
      ...row,
      is_active: Boolean(row.is_active),
      category: row.category ? JSON.parse(row.category) : undefined,
      next_due_date: calculateNextDueDate(row.due_day, row.frequency),
    }));
  },

  getById(id: number): RecurringBill | undefined {
    const row = getOne<BillRow>(`
      SELECT b.*,
        json_object('id', c.id, 'name', c.name, 'type', c.type, 'color', c.color) as category
      FROM recurring_bills b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);

    if (!row) return undefined;
    return {
      ...row,
      is_active: Boolean(row.is_active),
      category: row.category ? JSON.parse(row.category) : undefined,
      next_due_date: calculateNextDueDate(row.due_day, row.frequency),
    };
  },

  create(data: Omit<RecurringBill, 'id' | 'category' | 'next_due_date'>): RecurringBill {
    const id = insertAndGetId(`
      INSERT INTO recurring_bills (name, amount, category_id, frequency, due_day, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.amount,
      data.category_id,
      data.frequency,
      data.due_day,
      data.is_active ? 1 : 0
    ]);
    return this.getById(id)!;
  },

  update(id: number, data: Partial<Omit<RecurringBill, 'id' | 'category' | 'next_due_date'>>): RecurringBill | undefined {
    const current = this.getById(id);
    if (!current) return undefined;

    const updated = {
      name: data.name ?? current.name,
      amount: data.amount ?? current.amount,
      category_id: data.category_id ?? current.category_id,
      frequency: data.frequency ?? current.frequency,
      due_day: data.due_day ?? current.due_day,
      is_active: data.is_active ?? current.is_active,
    };

    runQuery(`
      UPDATE recurring_bills
      SET name = ?, amount = ?, category_id = ?, frequency = ?, due_day = ?, is_active = ?
      WHERE id = ?
    `, [
      updated.name,
      updated.amount,
      updated.category_id,
      updated.frequency,
      updated.due_day,
      updated.is_active ? 1 : 0,
      id
    ]);

    return this.getById(id);
  },

  delete(id: number): boolean {
    const before = this.getById(id);
    if (!before) return false;
    runQuery('DELETE FROM recurring_bills WHERE id = ?', [id]);
    return true;
  },

  getUpcoming(days: number = 7): RecurringBill[] {
    const bills = this.getAll().filter((b) => b.is_active);
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return bills.filter((bill) => {
      if (!bill.next_due_date) return false;
      const dueDate = new Date(bill.next_due_date);
      return dueDate >= today && dueDate <= futureDate;
    });
  },
};

export const paymentsModel = {
  getAll(filters: { startDate?: string; endDate?: string } = {}): BillPayment[] {
    let query = `
      SELECT p.*,
        CASE WHEN b.id IS NOT NULL THEN
          json_object('id', b.id, 'name', b.name, 'amount', b.amount, 'frequency', b.frequency, 'due_day', b.due_day)
        ELSE NULL END as recurring_bill
      FROM bill_payments p
      LEFT JOIN recurring_bills b ON p.recurring_bill_id = b.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (filters.startDate) {
      query += ' AND p.paid_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND p.paid_date <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY p.paid_date DESC';

    const rows = getAll<PaymentRow>(query, params);
    return rows.map((row) => ({
      ...row,
      recurring_bill: row.recurring_bill ? JSON.parse(row.recurring_bill) : undefined,
    }));
  },

  create(data: Omit<BillPayment, 'id' | 'recurring_bill'>): BillPayment {
    const id = insertAndGetId(`
      INSERT INTO bill_payments (recurring_bill_id, amount, paid_date, due_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [
      data.recurring_bill_id,
      data.amount,
      data.paid_date,
      data.due_date,
      data.status
    ]);
    return { ...data, id };
  },

  update(id: number, data: Partial<Omit<BillPayment, 'id' | 'recurring_bill'>>): BillPayment | undefined {
    const current = getOne<BillPayment>('SELECT * FROM bill_payments WHERE id = ?', [id]);
    if (!current) return undefined;

    const updated = { ...current, ...data };
    runQuery(`
      UPDATE bill_payments
      SET recurring_bill_id = ?, amount = ?, paid_date = ?, due_date = ?, status = ?
      WHERE id = ?
    `, [
      updated.recurring_bill_id,
      updated.amount,
      updated.paid_date,
      updated.due_date,
      updated.status,
      id
    ]);

    return updated;
  },

  payBill(billId: number, amount: number, paidDate: string): BillPayment {
    const bill = billsModel.getById(billId);
    if (!bill) throw new Error('Bill not found');

    const dueDate = bill.next_due_date || paidDate;
    return this.create({
      recurring_bill_id: billId,
      amount,
      paid_date: paidDate,
      due_date: dueDate,
      status: 'paid',
    });
  },
};
