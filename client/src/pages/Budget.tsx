import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { format, addMonths, subMonths, parseISO, startOfMonth } from 'date-fns';
import { getBudgetSummary, setBudget, getCategories } from '../services/api';
import type { BudgetSummary, Category } from '../types';

export default function Budget() {
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const monthKey = format(selectedMonth, 'yyyy-MM');

  useEffect(() => {
    loadData();
  }, [monthKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetData, categoriesData] = await Promise.all([
        getBudgetSummary(monthKey),
        getCategories(),
      ]);
      setBudgets(budgetData);
      setCategories(categoriesData.filter((c) => c.type === 'expense'));
      setError(null);
    } catch (err) {
      setError('Failed to load budget data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

  const handleSetBudget = async (categoryId: number) => {
    try {
      await setBudget({
        category_id: categoryId,
        amount: parseFloat(editAmount),
        month: monthKey,
      });
      setEditingCategory(null);
      setEditAmount('');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to set budget');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getBudgetForCategory = (categoryId: number) => {
    return budgets.find((b) => b.category.id === categoryId);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Monthly Budget</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center' }}>
            {format(selectedMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {categories.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              No expense categories found. Please create categories first to set budgets.
            </Alert>
          </Grid>
        ) : (
          categories.map((category) => {
            const budget = getBudgetForCategory(category.id);
            const isEditing = editingCategory === category.id;

            return (
              <Grid item xs={12} md={6} key={category.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 1,
                            bgcolor: category.color,
                          }}
                        />
                        <Typography variant="h6">{category.name}</Typography>
                      </Box>
                      {!isEditing && (
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingCategory(category.id);
                            setEditAmount(budget?.budget_amount.toString() || '');
                          }}
                        >
                          {budget ? 'Edit' : 'Set'} Budget
                        </Button>
                      )}
                    </Box>

                    {isEditing ? (
                      <Box display="flex" gap={1} alignItems="center">
                        <TextField
                          size="small"
                          type="number"
                          label="Budget Amount"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSetBudget(category.id)}
                          disabled={!editAmount}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingCategory(null);
                            setEditAmount('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    ) : budget ? (
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(budget.spent)} spent
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(budget.budget_amount)} budget
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(budget.percentage, 100)}
                          color={
                            budget.percentage > 100 ? 'error' : budget.percentage > 80 ? 'warning' : 'primary'
                          }
                          sx={{ height: 10, borderRadius: 1 }}
                        />
                        <Box display="flex" justifyContent="space-between" mt={1}>
                          <Typography
                            variant="body2"
                            color={budget.remaining >= 0 ? 'success.main' : 'error.main'}
                          >
                            {budget.remaining >= 0
                              ? `${formatCurrency(budget.remaining)} remaining`
                              : `${formatCurrency(Math.abs(budget.remaining))} over budget`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {budget.percentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No budget set for this category</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Box>
  );
}
