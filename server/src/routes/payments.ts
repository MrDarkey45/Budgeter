import { Router } from 'express';
import { paymentsModel } from '../models/bills';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const payments = paymentsModel.getAll({
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/', (req, res) => {
  try {
    const { recurring_bill_id, amount, paid_date, due_date, status } = req.body;
    if (!amount || !paid_date || !due_date) {
      return res.status(400).json({ error: 'Amount, paid_date, and due_date are required' });
    }
    const payment = paymentsModel.create({
      recurring_bill_id: recurring_bill_id ? parseInt(recurring_bill_id) : null,
      amount: parseFloat(amount),
      paid_date,
      due_date,
      status: status || 'paid',
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const payment = paymentsModel.update(id, req.body);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

export default router;
