import { Router } from 'express';
import { transactionsModel } from '../models/transactions';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { startDate, endDate, category_id, type } = req.query;
    const transactions = transactionsModel.getAll({
      startDate: startDate as string,
      endDate: endDate as string,
      category_id: category_id ? parseInt(category_id as string) : undefined,
      type: type as 'income' | 'expense' | undefined,
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/', (req, res) => {
  try {
    const { amount, description, category_id, date, type } = req.body;
    if (!amount || !description || !category_id || !date || !type) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const transaction = transactionsModel.create({
      amount: parseFloat(amount),
      description,
      category_id: parseInt(category_id),
      date,
      type,
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = transactionsModel.update(id, req.body);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = transactionsModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
