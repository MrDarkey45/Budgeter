import { Router } from 'express';
import { budgetsModel } from '../models/budgets';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }
    const budgets = budgetsModel.getByMonth(month as string);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

router.post('/', (req, res) => {
  try {
    const { category_id, amount, month } = req.body;
    if (!category_id || !amount || !month) {
      return res.status(400).json({ error: 'category_id, amount, and month are required' });
    }
    const budget = budgetsModel.setBudget({
      category_id: parseInt(category_id),
      amount: parseFloat(amount),
      month,
    });
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error setting budget:', error);
    res.status(500).json({ error: 'Failed to set budget' });
  }
});

router.get('/summary', (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }
    const summary = budgetsModel.getSummary(month as string);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

export default router;
