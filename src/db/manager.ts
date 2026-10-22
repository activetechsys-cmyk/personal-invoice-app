
import * as SQLite from 'expo-sqlite';
import { BusinessProfile, Client, Invoice, InvoiceItem } from '../types';

const db = SQLite.openDatabaseSync('invoice_app.db');

export const DBManager = {
  async init() {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY, 
        name TEXT, 
        address TEXT, 
        email TEXT, 
        phone TEXT, 
        taxId TEXT,
        logoUri TEXT,
        signatureUri TEXT
      );
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        email TEXT, 
        phone TEXT, 
        address TEXT
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY, 
        invoiceNumber TEXT, 
        clientId TEXT, 
        dateIssued TEXT, 
        dateDue TEXT, 
        taxRate REAL, 
        discountRate REAL, 
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY, 
        invoiceId TEXT, 
        description TEXT, 
        quantity REAL, 
        unitPrice REAL,
        FOREIGN KEY(invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
      );
    `);

    try {
      await db.execAsync('ALTER TABLE profile ADD COLUMN logoUri TEXT;');
    } catch (e) { }
    try {
      await db.execAsync('ALTER TABLE profile ADD COLUMN signatureUri TEXT;');
    } catch (e) { }
  },

  async getProfile(): Promise<BusinessProfile> {
    const result = await db.getFirstAsync<{ 
      name: string, address: string, email: string, phone: string, taxId: string, logoUri: string, signatureUri: string 
    }>('SELECT name, address, email, phone, taxId, logoUri, signatureUri FROM profile WHERE id = 1');
    
    return result || { name: '', address: '', email: '', phone: '', taxId: '' };
  },

  async saveProfile(profile: BusinessProfile) {
    await db.runAsync(
      'INSERT OR REPLACE INTO profile (id, name, address, email, phone, taxId, logoUri, signatureUri) VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
      [profile.name, profile.address, profile.email, profile.phone, profile.taxId, profile.logoUri, profile.signatureUri]
    );
  },

  async getClients(): Promise<Client[]> {
    return await db.getAllAsync<Client>('SELECT * FROM clients');
  },

  async saveClient(client: Client) {
    await db.runAsync(
      'INSERT OR REPLACE INTO clients (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [client.id, client.name, client.email, client.phone, client.address]
    );
  },

  async deleteClient(id: string) {
    await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
  },

  async getInvoices(): Promise<Invoice[]> {
    const invoices = await db.getAllAsync<Invoice>('SELECT * FROM invoices');
    for (const invoice of invoices) {
      invoice.items = await this.getItemsForInvoice(invoice.id);
    }
    return invoices;
  },

  async getItemsForInvoice(invoiceId: string): Promise<InvoiceItem[]> {
    return await db.getAllAsync<InvoiceItem>('SELECT * FROM invoice_items WHERE invoiceId = ?', [invoiceId]);
  },

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'items'>, items: InvoiceItem[]): Promise<string> {
    const id = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          'INSERT OR REPLACE INTO invoices (id, invoiceNumber, clientId, dateIssued, dateDue, taxRate, discountRate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            String(id), 
            String(invoiceData.invoiceNumber || ''), 
            String(invoiceData.clientId || ''), 
            String(invoiceData.dateIssued || ''), 
            String(invoiceData.dateDue || ''), 
            Number(invoiceData.taxRate) || 0, 
            Number(invoiceData.discountRate) || 0, 
            String(invoiceData.notes || '')
          ]
        );

        for (const item of items) {
          const freshItemId = `item_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
          await db.runAsync(
            'INSERT INTO invoice_items (id, invoiceId, description, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)',
            [
              String(freshItemId), 
              String(id), 
              String(item.description || ''), 
              Number(item.quantity) || 0, 
              Number(item.unitPrice) || 0
            ]
          );
        }
      });
      return id;
    } catch (e) {
      console.error('Database Error during createInvoice:', e);
      throw e;
    }
  },

  async saveInvoice(invoice: Invoice) {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT OR REPLACE INTO invoices (id, invoiceNumber, clientId, dateIssued, dateDue, taxRate, discountRate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          String(invoice.id), 
          String(invoice.invoiceNumber || ''), 
          String(invoice.clientId || ''), 
          String(invoice.dateIssued || ''), 
          String(invoice.dateDue || ''), 
          Number(invoice.taxRate) || 0, 
          Number(invoice.discountRate) || 0, 
          String(invoice.notes || '')
        ]
      );

      await db.runAsync('DELETE FROM invoice_items WHERE invoiceId = ?', [invoice.id]);

      for (const item of invoice.items) {
        const freshItemId = `item_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        await db.runAsync(
          'INSERT INTO invoice_items (id, invoiceId, description, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)',
          [
            String(freshItemId), 
            String(invoice.id), 
            String(item.description || ''), 
            Number(item.quantity) || 0, 
            Number(item.unitPrice) || 0
          ]
        );
      }
    });
  },

  async deleteInvoice(id: string) {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM invoices WHERE id = ?', [id]);
      await db.runAsync('DELETE FROM invoice_items WHERE invoiceId = ?', [id]);
    });
  }
};
