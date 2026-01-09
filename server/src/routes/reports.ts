import { Router } from 'express';
import { reportsModel } from '../models/reports';
import { paymentsModel } from '../models/bills';

const router = Router();

router.get('/spending', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    const report = reportsModel.getSpendingByCategory(startDate as string, endDate as string);
    res.json(report);
  } catch (error) {
    console.error('Error fetching spending report:', error);
    res.status(500).json({ error: 'Failed to fetch spending report' });
  }
});

router.get('/trends', (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const trends = reportsModel.getMonthlyTrends(months);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends report:', error);
    res.status(500).json({ error: 'Failed to fetch trends report' });
  }
});

router.get('/bills', (req, res) => {
  try {
    const payments = paymentsModel.getAll();
    res.json(payments);
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    res.status(500).json({ error: 'Failed to fetch bill payments' });
  }
});

export default router;
