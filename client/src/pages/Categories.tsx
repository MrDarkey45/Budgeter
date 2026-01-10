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
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import type { Category } from '../types';

const DEFAULT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0',
  '#00bcd4', '#795548', '#607d8b', '#f44336', '#3f51b5',
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: DEFAULT_COLORS[0],
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
      });
    } else {
      setEditingCategory(null);
      const usedColors = categories.map((c) => c.color);
      const availableColor = DEFAULT_COLORS.find((c) => !usedColors.includes(c)) || DEFAULT_COLORS[0];
      setFormData({
        name: '',
        type: 'expense',
        color: availableColor,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      handleCloseDialog();
      loadCategories();
    } catch (err) {
      console.error(err);
      setError('Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This may affect associated transactions.')) {
      return;
    }
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      console.error(err);
      setError('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Category
        </Button>
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        {/* Income Categories */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              Income Categories
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Color</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No income categories
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: category.color }} />
                        </TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenDialog(category)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(category.id)}>
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

        {/* Expense Categories */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error.main">
              Expense Categories
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Color</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No expense categories
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: category.color }} />
                        </TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenDialog(category)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(category.id)}>
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
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="e.g., Groceries, Salary"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Color
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {DEFAULT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: color,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid #000' : '3px solid transparent',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name}>
            {editingCategory ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
