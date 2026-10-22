
export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER,
    invoiceNumber TEXT NOT NULL,
    dateIssued TEXT NOT NULL,
    dateDue TEXT NOT NULL,
    taxRate REAL DEFAULT 0,
    discountRate REAL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (clientId) REFERENCES clients (id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceId INTEGER,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unitPrice REAL NOT NULL,
    FOREIGN KEY (invoiceId) REFERENCES invoices (id) ON DELETE CASCADE
  );
`;
