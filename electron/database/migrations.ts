export const migrations = [
  `
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  publish_date TEXT,
  purchase_price REAL,
  purchase_date TEXT,
  status TEXT NOT NULL DEFAULT 'unread',
  rating INTEGER CHECK(rating BETWEEN 0 AND 5),
  notes TEXT,
  cover_image TEXT,
  shelf_location_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (shelf_location_id) REFERENCES shelf_locations(id)
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#8B6914',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS book_tags (
  book_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (book_id, tag_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shelf_locations (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('room', 'cabinet', 'shelf', 'slot')),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  position_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES shelf_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS borrow_records (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_contact TEXT,
  borrow_date TEXT NOT NULL,
  expected_return_date TEXT NOT NULL,
  actual_return_date TEXT,
  enable_reminder INTEGER NOT NULL DEFAULT 1,
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  isbn TEXT,
  estimated_price REAL,
  source_url TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
  notes TEXT,
  cover_image TEXT,
  purchased INTEGER NOT NULL DEFAULT 0,
  actual_price REAL,
  purchase_date TEXT,
  book_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  monthly_budget REAL NOT NULL DEFAULT 0,
  yearly_budget REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_records(actual_return_date);
CREATE INDEX IF NOT EXISTS idx_borrow_expected ON borrow_records(expected_return_date);
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist_items(priority);
CREATE INDEX IF NOT EXISTS idx_shelf_type ON shelf_locations(type);

INSERT OR IGNORE INTO budgets (id, monthly_budget, yearly_budget, created_at, updated_at)
VALUES ('default', 200, 2000, datetime('now'), datetime('now'));
  `,
  `
ALTER TABLE wishlist_items ADD COLUMN source_url TEXT;
  `,
  `
ALTER TABLE budgets ADD COLUMN year INTEGER;
  `,
  `
ALTER TABLE budgets ADD COLUMN monthly_amount REAL;
  `,
];
