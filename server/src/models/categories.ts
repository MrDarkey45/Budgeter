import { getAll, getOne, runQuery, insertAndGetId } from '../db/database';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export const categoriesModel = {
  getAll(): Category[] {
    return getAll<Category>('SELECT * FROM categories ORDER BY type, name');
  },

  getById(id: number): Category | undefined {
    return getOne<Category>('SELECT * FROM categories WHERE id = ?', [id]);
  },

  create(data: Omit<Category, 'id'>): Category {
    const id = insertAndGetId(
      'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)',
      [data.name, data.type, data.color]
    );
    return { ...data, id };
  },

  update(id: number, data: Partial<Omit<Category, 'id'>>): Category | undefined {
    const current = this.getById(id);
    if (!current) return undefined;

    const updated = { ...current, ...data };
    runQuery(
      'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?',
      [updated.name, updated.type, updated.color, id]
    );
    return updated;
  },

  delete(id: number): boolean {
    const before = this.getById(id);
    if (!before) return false;
    runQuery('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  },
};
