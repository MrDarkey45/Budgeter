import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';

import categoriesRouter from './routes/categories';
import transactionsRouter from './routes/transactions';
import billsRouter from './routes/bills';
import paymentsRouter from './routes/payments';
import budgetsRouter from './routes/budgets';
import reportsRouter from './routes/reports';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
