import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import { format, parseISO } from 'date-fns';
import { getDashboard } from '../services/api';
import type { DashboardSummary } from '../types';

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await getDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return <Alert severity="info">No data available</Alert>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUpIcon color="success" />
                <Typography color="text.secondary" variant="body2">
                  Income This Month
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1, color: 'success.main' }}>
                {formatCurrency(data.total_income)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingDownIcon color="error" />
                <Typography color="text.secondary" variant="body2">
                  Expenses This Month
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1, color: 'error.main' }}>
                {formatCurrency(data.total_expenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <SavingsIcon color="primary" />
                <Typography color="text.secondary" variant="body2">
                  Savings This Month
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ mt: 1, color: data.savings >= 0 ? 'primary.main' : 'error.main' }}
              >
                {formatCurrency(data.savings)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Bills */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Bills (Next 7 Days)
              </Typography>
              {data.upcoming_bills.length === 0 ? (
                <Typography color="text.secondary">No upcoming bills</Typography>
              ) : (
                <List dense>
                  {data.upcoming_bills.map((bill) => (
                    <ListItem key={bill.id} divider>
                      <ListItemText
                        primary={bill.name}
                        secondary={`Due: ${bill.next_due_date ? format(parseISO(bill.next_due_date), 'MMM d') : 'N/A'}`}
                      />
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(bill.amount)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Status
              </Typography>
              {data.budget_status.length === 0 ? (
                <Typography color="text.secondary">No budgets set</Typography>
              ) : (
                <Box>
                  {data.budget_status.map((budget) => (
                    <Box key={budget.category.id} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2">{budget.category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_amount)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(budget.percentage, 100)}
                        color={budget.percentage > 100 ? 'error' : budget.percentage > 80 ? 'warning' : 'primary'}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              {data.recent_transactions.length === 0 ? (
                <Typography color="text.secondary">No recent transactions</Typography>
              ) : (
                <List dense>
                  {data.recent_transactions.map((transaction) => (
                    <ListItem key={transaction.id} divider>
                      <ListItemText
                        primary={transaction.description}
                        secondary={format(parseISO(transaction.date), 'MMM d, yyyy')}
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        {transaction.category && (
                          <Chip
                            label={transaction.category.name}
                            size="small"
                            sx={{ bgcolor: transaction.category.color, color: 'white' }}
                          />
                        )}
                        <Typography
                          variant="body1"
                          fontWeight="medium"
                          color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
