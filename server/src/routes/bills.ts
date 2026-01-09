import { Router } from 'express';
import { billsModel, paymentsModel } from '../models/bills';

const router = Router();

// Recurring Bills
router.get('/', (req, res) => {
  try {
    const bills = billsModel.getAll();
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, amount, category_id, frequency, due_day, is_active } = req.body;
    if (!name || !amount || !category_id || !frequency || !due_day) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const bill = billsModel.create({
      name,
      amount: parseFloat(amount),
      category_id: parseInt(category_id),
      frequency,
      due_day: parseInt(due_day),
      is_active: is_active !== false,
    });
    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bill = billsModel.update(id, req.body);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = billsModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

router.post('/:id/pay', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, paid_date } = req.body;
    if (!amount || !paid_date) {
      return res.status(400).json({ error: 'Amount and paid_date are required' });
    }
    const payment = paymentsModel.payBill(id, parseFloat(amount), paid_date);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
