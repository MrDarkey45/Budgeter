export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  category?: Category;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
}

export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  category_id: number;
  category?: Category;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  due_day: number;
  is_active: boolean;
  next_due_date?: string;
}

export interface BillPayment {
  id: number;
  recurring_bill_id: number | null;
  recurring_bill?: RecurringBill;
  amount: number;
  paid_date: string;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Budget {
  id: number;
  category_id: number;
  category?: Category;
  amount: number;
  month: string;
  spent?: number;
}

export interface BudgetSummary {
  category: Category;
  budget_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

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

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  savings: number;
  upcoming_bills: RecurringBill[];
  recent_transactions: Transaction[];
  budget_status: BudgetSummary[];
}
