import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'budgeter.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: SqlJsDatabase;

export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Initialize schema
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      color TEXT NOT NULL DEFAULT '#2196f3'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
      due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bill_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recurring_bill_id INTEGER,
      amount REAL NOT NULL,
      paid_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue')),
      FOREIGN KEY (recurring_bill_id) REFERENCES recurring_bills(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(category_id, month)
    )
  `);

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_bill_payments_date ON bill_payments(paid_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month)');

  // Save to file
  saveDatabase();

  return db;
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper functions to work with sql.js
export function runQuery(sql: string, params: unknown[] = []): void {
  getDatabase().run(sql, params);
  saveDatabase();
}

export function getOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = getDatabase().prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row as T;
  }
  stmt.free();
  return undefined;
}

export function getAll<T>(sql: string, params: unknown[] = []): T[] {
  const results: T[] = [];
  const stmt = getDatabase().prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function insertAndGetId(sql: string, params: unknown[] = []): number {
  const db = getDatabase();
  db.run(sql, params);
  const result = getOne<{ id: number }>('SELECT last_insert_rowid() as id');
  saveDatabase();
  return result?.id || 0;
}
