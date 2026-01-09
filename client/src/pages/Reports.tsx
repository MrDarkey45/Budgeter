import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getSpendingReport, getTrendReport } from '../services/api';
import type { SpendingReport, TrendReport } from '../types';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('3');
  const [spendingData, setSpendingData] = useState<SpendingReport[]>([]);
  const [trendData, setTrendData] = useState<TrendReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const months = parseInt(timeRange);
      const endDate = endOfMonth(new Date());
      const startDate = startOfMonth(subMonths(new Date(), months - 1));

      const [spending, trends] = await Promise.all([
        getSpendingReport({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        }),
        getTrendReport({ months }),
      ]);

      setSpendingData(spending);
      setTrendData(trends);
      setError(null);
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalSpending = spendingData.reduce((sum, item) => sum + item.total, 0);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Financial Reports</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
            <MenuItem value="1">Last Month</MenuItem>
            <MenuItem value="3">Last 3 Months</MenuItem>
            <MenuItem value="6">Last 6 Months</MenuItem>
            <MenuItem value="12">Last 12 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Spending by Category Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              {spendingData.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No spending data for this period
                </Typography>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={spendingData}
                        dataKey="total"
                        nameKey="category.name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ category, percentage }) => `${category.name} (${percentage.toFixed(0)}%)`}
                      >
                        {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.category.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    Total: {formatCurrency(totalSpending)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              {spendingData.length === 0 ? (
                <Typography color="text.secondary">No data available</Typography>
              ) : (
                <Box>
                  {spendingData.map((item) => (
                    <Box
                      key={item.category.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1}
                      borderBottom="1px solid"
                      borderColor="divider"
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: item.category.color,
                          }}
                        />
                        <Typography>{item.category.name}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography fontWeight="medium">{formatCurrency(item.total)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Income vs Expenses Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Income vs Expenses Trend
              </Typography>
              {trendData.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No trend data available
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(m) => format(new Date(m + '-01'), 'MMM yy')} />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#2e7d32" name="Income" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#d32f2f" name="Expenses" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Savings Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Savings
              </Typography>
              {trendData.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No savings data available
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(m) => format(new Date(m + '-01'), 'MMM yy')} />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar
                      dataKey="savings"
                      name="Savings"
                      fill="#1565c0"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
