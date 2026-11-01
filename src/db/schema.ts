import SQLite from 'expo-sqlite';

// Create SQLite database
const db = await SQLite.openDatabaseAsync('invoices.db');

export const initDatabase = async () => {
  try {
    // Create invoices table if it doesn't exist
    await db.execAsync(
      "CREATE TABLE IF NOT EXISTS invoices ("
        + "id TEXT PRIMARY KEY,"
        + "invoice_number TEXT,"
        + "client_name TEXT,"
        + "client_email TEXT,"
        + "issue_date TEXT,"
        + "due_date TEXT,"
        + "items TEXT,"
        + "total_amount REAL,"
        + "status TEXT"
      + ")"
    );
    console.log('SQLite database initialized');
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    throw error;
  }
};

export default db;