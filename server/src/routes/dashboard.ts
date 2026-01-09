import { Router } from 'express';
import { transactionsModel } from '../models/transactions';
import { billsModel } from '../models/bills';
import { budgetsModel } from '../models/budgets';

const router = Router();

router.get('/', (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);

    // Get monthly totals
    const totals = transactionsModel.getMonthlyTotals(currentMonth);

    // Get upcoming bills (next 7 days)
    const upcomingBills = billsModel.getUpcoming(7);

    // Get recent transactions
    const recentTransactions = transactionsModel.getRecent(5);

    // Get budget status
    const budgetStatus = budgetsModel.getSummary(currentMonth);

    res.json({
      total_income: totals.income,
      total_expenses: totals.expenses,
      savings: totals.income - totals.expenses,
      upcoming_bills: upcomingBills,
      recent_transactions: recentTransactions,
      budget_status: budgetStatus,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
