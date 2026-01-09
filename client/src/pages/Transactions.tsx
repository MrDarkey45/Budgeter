import { useState, useEffect, useMemo } from 'react';
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
  TablePagination,
  TableSortLabel,
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
  InputAdornment,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { format, parseISO } from 'date-fns';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
} from '../services/api';
import type { Transaction, Category } from '../types';

type SortField = 'date' | 'description' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense' as 'income' | 'expense',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData] = await Promise.all([getTransactions(), getCategories()]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category?.name.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }

    // Apply category filter
    if (filterCategory) {
      result = result.filter((t) => t.category_id.toString() === filterCategory);
    }

    // Apply date filters
    if (startDate) {
      result = result.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      result = result.filter((t) => t.date <= endDate);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchQuery, filterType, filterCategory, startDate, endDate, sortField, sortOrder]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedTransactions.slice(start, start + rowsPerPage);
  }, [filteredAndSortedTransactions, page, rowsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterCategory('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || filterType !== 'all' || filterCategory || startDate || endDate;

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        category_id: transaction.category_id.toString(),
        date: transaction.date,
        type: transaction.type,
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: parseInt(formData.category_id),
        date: formData.date,
        type: formData.type,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await createTransaction(data);
      }

      handleCloseDialog();
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save transaction');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

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
        <Typography variant="h5">Transactions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Transaction
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => {
                    setFilterType(e.target.value as 'all' | 'income' | 'expense');
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {hasActiveFilters && (
              <Grid item xs={12} sm={3} md={1}>
                <Button size="small" startIcon={<ClearIcon />} onClick={clearFilters}>
                  Clear
                </Button>
              </Grid>
            )}
          </Grid>
          {hasActiveFilters && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'date'}
                      direction={sortField === 'date' ? sortOrder : 'desc'}
                      onClick={() => handleSort('date')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'description'}
                      direction={sortField === 'description' ? sortOrder : 'desc'}
                      onClick={() => handleSort('description')}
                    >
                      Description
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'amount'}
                      direction={sortField === 'amount' ? sortOrder : 'desc'}
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {hasActiveFilters ? 'No transactions match your filters' : 'No transactions found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{format(parseISO(transaction.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {transaction.category && (
                          <Chip
                            label={transaction.category.name}
                            size="small"
                            sx={{ bgcolor: transaction.category.color, color: 'white' }}
                          />
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: transaction.type === 'income' ? 'success.main' : 'error.main' }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(transaction)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(transaction.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredAndSortedTransactions.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category_id: '' })
                }
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category_id}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {filteredCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.amount || !formData.description || !formData.category_id}
          >
            {editingTransaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
