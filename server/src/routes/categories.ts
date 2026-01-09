import { Router } from 'express';
import { categoriesModel } from '../models/categories';

const router = Router();

router.get('/', (req, res) => {
  try {
    const categories = categoriesModel.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    const category = categoriesModel.create({ name, type, color: color || '#2196f3' });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = categoriesModel.update(id, req.body);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = categoriesModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
