import axios from 'axios';
import type {
  Category,
  Transaction,
  RecurringBill,
  BillPayment,
  Budget,
  BudgetSummary,
  SpendingReport,
  TrendReport,
  DashboardSummary,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Categories
export const getCategories = () => api.get<Category[]>('/categories').then((r) => r.data);
export const createCategory = (data: Omit<Category, 'id'>) =>
  api.post<Category>('/categories', data).then((r) => r.data);
export const updateCategory = (id: number, data: Partial<Category>) =>
  api.put<Category>(`/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (params?: { startDate?: string; endDate?: string; category_id?: number }) =>
  api.get<Transaction[]>('/transactions', { params }).then((r) => r.data);
export const createTransaction = (data: Omit<Transaction, 'id' | 'created_at' | 'category'>) =>
  api.post<Transaction>('/transactions', data).then((r) => r.data);
export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data);
export const deleteTransaction = (id: number) => api.delete(`/transactions/${id}`);

// Recurring Bills
export const getBills = () => api.get<RecurringBill[]>('/bills').then((r) => r.data);
export const createBill = (data: Omit<RecurringBill, 'id' | 'category' | 'next_due_date'>) =>
  api.post<RecurringBill>('/bills', data).then((r) => r.data);
export const updateBill = (id: number, data: Partial<RecurringBill>) =>
  api.put<RecurringBill>(`/bills/${id}`, data).then((r) => r.data);
export const deleteBill = (id: number) => api.delete(`/bills/${id}`);
export const payBill = (id: number, data: { amount: number; paid_date: string }) =>
  api.post<BillPayment>(`/bills/${id}/pay`, data).then((r) => r.data);

// Bill Payments
export const getPayments = (params?: { startDate?: string; endDate?: string }) =>
  api.get<BillPayment[]>('/payments', { params }).then((r) => r.data);
export const createPayment = (data: Omit<BillPayment, 'id' | 'recurring_bill'>) =>
  api.post<BillPayment>('/payments', data).then((r) => r.data);
export const updatePayment = (id: number, data: Partial<BillPayment>) =>
  api.put<BillPayment>(`/payments/${id}`, data).then((r) => r.data);

// Budgets
export const getBudgets = (month: string) =>
  api.get<Budget[]>('/budgets', { params: { month } }).then((r) => r.data);
export const setBudget = (data: { category_id: number; amount: number; month: string }) =>
  api.post<Budget>('/budgets', data).then((r) => r.data);
export const getBudgetSummary = (month: string) =>
  api.get<BudgetSummary[]>('/budgets/summary', { params: { month } }).then((r) => r.data);

// Reports
export const getSpendingReport = (params: { startDate: string; endDate: string }) =>
  api.get<SpendingReport[]>('/reports/spending', { params }).then((r) => r.data);
export const getTrendReport = (params: { months: number }) =>
  api.get<TrendReport[]>('/reports/trends', { params }).then((r) => r.data);
export const getBillsReport = () => api.get<BillPayment[]>('/reports/bills').then((r) => r.data);

// Dashboard
export const getDashboard = () => api.get<DashboardSummary>('/dashboard').then((r) => r.data);
