
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';
import { Client, Invoice, InvoiceItem } from '../types';

const db = SQLite.openDatabaseSync('invoice_app.db');

export const DBManager = {
  async init() {
    await db.execAsync(CREATE_TABLES);
  },

  // CLIENTS
  async addClient(client: Omit<Client, 'id'>) {
    const result = await db.runAsync(
      'INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [client.name, client.email, client.phone, client.address]
    );
    return result.lastInsertRowId;
  },

  async getClients() {
    return await db.getAllAsync<Client>('SELECT * FROM clients');
  },

  // INVOICES
  async createInvoice(invoice: Omit<Invoice, 'id' | 'items'>, items: InvoiceItem[]) {
    const result = await db.runAsync(
      'INSERT INTO invoices (clientId, invoiceNumber, dateIssued, dateDue, taxRate, discountRate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [invoice.clientId, invoice.invoiceNumber, invoice.dateIssued, invoice.dateDue, invoice.taxRate, invoice.discountRate, invoice.notes]
    );
    const invoiceId = result.lastInsertRowId;

    for (const item of items) {
      await db.runAsync(
        'INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice) VALUES (?, ?, ?, ?)',
        [invoiceId, item.description, item.quantity, item.unitPrice]
      );
    }
    return invoiceId;
  },

  async getInvoices() {
    return await db.getAllAsync<Invoice>('SELECT * FROM invoices');
  },

  async getInvoiceDetails(id: number) {
    const invoice = await db.getFirstAsync<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) return null;

    const items = await db.getAllAsync<InvoiceItem>('SELECT * FROM invoice_items WHERE invoiceId = ?', [id]);
    return { ...invoice, items };
  }
};
