import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import { format, parseISO } from 'date-fns';
import { getBills, createBill, updateBill, deleteBill, payBill, getCategories } from '../services/api';
import type { RecurringBill, Category } from '../types';

export default function Bills() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [payingBill, setPayingBill] = useState<RecurringBill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category_id: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    due_day: '1',
    is_active: true,
  });
  const [payFormData, setPayFormData] = useState({
    amount: '',
    paid_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billsData, categoriesData] = await Promise.all([getBills(), getCategories()]);
      setBills(billsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bill?: RecurringBill) => {
    if (bill) {
      setEditingBill(bill);
      setFormData({
        name: bill.name,
        amount: bill.amount.toString(),
        category_id: bill.category_id.toString(),
        frequency: bill.frequency,
        due_day: bill.due_day.toString(),
        is_active: bill.is_active,
      });
    } else {
      setEditingBill(null);
      setFormData({
        name: '',
        amount: '',
        category_id: '',
        frequency: 'monthly',
        due_day: '1',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBill(null);
  };

  const handleOpenPayDialog = (bill: RecurringBill) => {
    setPayingBill(bill);
    setPayFormData({
      amount: bill.amount.toString(),
      paid_date: format(new Date(), 'yyyy-MM-dd'),
    });
    setPayDialogOpen(true);
  };

  const handleClosePayDialog = () => {
    setPayDialogOpen(false);
    setPayingBill(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        frequency: formData.frequency,
        due_day: parseInt(formData.due_day),
        is_active: formData.is_active,
      };

      if (editingBill) {
        await updateBill(editingBill.id, data);
      } else {
        await createBill(data);
      }

      handleCloseDialog();
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save bill');
    }
  };

  const handlePaySubmit = async () => {
    if (!payingBill) return;
    try {
      await payBill(payingBill.id, {
        amount: parseFloat(payFormData.amount),
        paid_date: payFormData.paid_date,
      });
      handleClosePayDialog();
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to record payment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await deleteBill(id);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete bill');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

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

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Recurring Bills</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Bill
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Due Day</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Next Due</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No recurring bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.name}</TableCell>
                      <TableCell>
                        {bill.category && (
                          <Chip
                            label={bill.category.name}
                            size="small"
                            sx={{ bgcolor: bill.category.color, color: 'white' }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{bill.frequency}</TableCell>
                      <TableCell>{bill.due_day}</TableCell>
                      <TableCell align="right">{formatCurrency(bill.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={bill.is_active ? 'Active' : 'Inactive'}
                          color={bill.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {bill.next_due_date ? format(parseISO(bill.next_due_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenPayDialog(bill)}>
                          <PaymentIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenDialog(bill)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(bill.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Bill Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBill ? 'Edit Bill' : 'Add Recurring Bill'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Bill Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="e.g., Electric Bill"
            />
            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category_id}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {expenseCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={formData.frequency}
                label="Frequency"
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as 'monthly' | 'quarterly' | 'yearly' })
                }
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Due Day of Month"
              type="number"
              value={formData.due_day}
              onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
              fullWidth
              inputProps={{ min: 1, max: 31 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.amount || !formData.category_id}
          >
            {editingBill ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={payDialogOpen} onClose={handleClosePayDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment - {payingBill?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Amount Paid"
              type="number"
              value={payFormData.amount}
              onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Payment Date"
              type="date"
              value={payFormData.paid_date}
              onChange={(e) => setPayFormData({ ...payFormData, paid_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayDialog}>Cancel</Button>
          <Button onClick={handlePaySubmit} variant="contained" disabled={!payFormData.amount}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
