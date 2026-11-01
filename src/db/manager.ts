import * as SQLite from 'expo-sqlite';
import { BusinessProfile, Client, Invoice, InvoiceItem } from '../types';

const db = SQLite.openDatabaseSync('invoice_app.db');

const INVOICE_PREFIX = 'INV-';
const INVOICE_PAD = 4;

const EMPTY_PROFILE: BusinessProfile = {
  name: '',
  address: '',
  email: '',
  phone: '',
  taxId: '',
};

export function parseInvoiceSequence(value: string | null | undefined): number {
  const match = String(value ?? '').match(/(\d+)\s*$/);
  if (!match) return 0;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatInvoiceNumber(sequence: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(sequence) ? sequence : 0));
  return `${INVOICE_PREFIX}${String(n).padStart(INVOICE_PAD, '0')}`;
}

export function nextInvoiceNumber(last: string | null | undefined): string {
  return formatInvoiceNumber(parseInvoiceSequence(last) + 1);
}

type ProfileRow = BusinessProfile & { lastInvoiceNumber?: string | null };

function toProfile(row: ProfileRow | null | undefined): BusinessProfile {
  if (!row) return { ...EMPTY_PROFILE };
  return {
    name: row.name || '',
    address: row.address || '',
    email: row.email || '',
    phone: row.phone || '',
    taxId: row.taxId || '',
    logoUri: row.logoUri,
    signatureUri: row.signatureUri,
  };
}

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
        signatureUri TEXT,
        lastInvoiceNumber TEXT
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
    } catch (e) { /* column already exists */ }
    try {
      await db.execAsync('ALTER TABLE profile ADD COLUMN signatureUri TEXT;');
    } catch (e) { /* column already exists */ }
    try {
      await db.execAsync('ALTER TABLE profile ADD COLUMN lastInvoiceNumber TEXT;');
    } catch (e) { /* column already exists */ }

    try {
      await db.execAsync(`
        DELETE FROM invoices 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM invoices 
          GROUP BY invoiceNumber
        );
      `);
    } catch (e) {
      console.warn('Duplicate cleanup failed:', e);
    }

    try {
      await db.execAsync('CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoiceNumber);');
    } catch (e) {
      console.warn('Could not create unique invoice number index:', e);
    }
  },

  async getProfile(): Promise<BusinessProfile> {
    const result = await db.getFirstAsync<ProfileRow>(
      'SELECT name, address, email, phone, taxId, logoUri, signatureUri, lastInvoiceNumber FROM profile WHERE id = 1'
    );
    return toProfile(result);
  },

  async saveProfile(profile: BusinessProfile) {
    const lastInvoiceNumber = await this.getLastInvoiceNumber();
    await db.runAsync(
      'INSERT OR REPLACE INTO profile (id, name, address, email, phone, taxId, logoUri, signatureUri, lastInvoiceNumber) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        profile.name,
        profile.address,
        profile.email,
        profile.phone,
        profile.taxId,
        profile.logoUri ?? null,
        profile.signatureUri ?? null,
        lastInvoiceNumber,
      ]
    );
  },

  async getLastInvoiceNumber(): Promise<string> {
    const result = await db.getFirstAsync<{ lastInvoiceNumber: string | null }>(
      'SELECT lastInvoiceNumber FROM profile WHERE id = 1'
    );
    return formatInvoiceNumber(parseInvoiceSequence(result?.lastInvoiceNumber));
  },

  async getHighestInvoiceSequence(): Promise<number> {
    const lastStored = parseInvoiceSequence(await this.getLastInvoiceNumber());
    const rows = await db.getAllAsync<{ invoiceNumber: string }>('SELECT invoiceNumber FROM invoices');
    const lastIssued = rows.reduce((max, row) => Math.max(max, parseInvoiceSequence(row.invoiceNumber)), 0);
    return Math.max(lastStored, lastIssued);
  },

  async getNextInvoiceNumber(): Promise<string> {
    return formatInvoiceNumber((await this.getHighestInvoiceSequence()) + 1);
  },

  async setLastInvoiceNumber(num: string) {
    const normalized = formatInvoiceNumber(parseInvoiceSequence(num));
    await db.runAsync(
      `INSERT INTO profile (id, lastInvoiceNumber) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET lastInvoiceNumber = excluded.lastInvoiceNumber`,
      [normalized]
    );
  },

  async getClients(): Promise<Client[]> {
    return await db.getAllAsync<Client>('SELECT id, name, email, phone, address FROM clients ORDER BY name COLLATE NOCASE');
  },

  async getClientById(id: string): Promise<Client | null> {
    const result = await db.getFirstAsync<Client>(
      'SELECT id, name, email, phone, address FROM clients WHERE id = ?',
      [id]
    );
    return result ?? null;
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

  async getInvoiceByNumber(num: string): Promise<Invoice | null> {
    const result = await db.getFirstAsync<Invoice>('SELECT * FROM invoices WHERE invoiceNumber = ?', [num]);
    if (result) {
      result.items = await this.getItemsForInvoice(result.id);
    }
    return result ?? null;
  },

  async getInvoices(): Promise<Invoice[]> {
    const invoices = await db.getAllAsync<Invoice>('SELECT * FROM invoices ORDER BY dateIssued DESC, invoiceNumber DESC');
    for (const invoice of invoices) {
      invoice.items = await this.getItemsForInvoice(invoice.id);
    }
    return invoices;
  },

  async getItemsForInvoice(invoiceId: string): Promise<InvoiceItem[]> {
    return await db.getAllAsync<InvoiceItem>('SELECT * FROM invoice_items WHERE invoiceId = ?', [invoiceId]);
  },

  async createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'items' | 'invoiceNumber'> & { invoiceNumber?: string },
    items: InvoiceItem[]
  ): Promise<{ id: string; invoiceNumber: string }> {
    const id = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let invoiceNumber = '';

    try {
      await db.withTransactionAsync(async () => {
        const nextSequence = (await this.getHighestInvoiceSequence()) + 1;
        invoiceNumber = formatInvoiceNumber(nextSequence);

        await db.runAsync(
          'INSERT INTO invoices (id, invoiceNumber, clientId, dateIssued, taxRate, discountRate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            String(id),
            invoiceNumber,
            String(invoiceData.clientId || ''),
            String(invoiceData.dateIssued || ''),
            Number(invoiceData.taxRate) || 0,
            Number(invoiceData.discountRate) || 0,
            String(invoiceData.notes || ''),
          ]
        );

        await db.runAsync(
          `INSERT INTO profile (id, lastInvoiceNumber) VALUES (1, ?)
           ON CONFLICT(id) DO UPDATE SET lastInvoiceNumber = excluded.lastInvoiceNumber`,
          [invoiceNumber]
        );

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const freshItemId = `item_${Date.now()}_${i}_${Math.floor(Math.random() * 1000000)}`;
          await db.runAsync(
            'INSERT INTO invoice_items (id, invoiceId, description, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)',
            [
              String(freshItemId),
              String(id),
              String(item.description || ''),
              Number(item.quantity) || 0,
              Number(item.unitPrice) || 0,
            ]
          );
        }
      });
      return { id, invoiceNumber };
    } catch (e) {
      console.error('Database Error during createInvoice:', e);
      throw e;
    }
  },

  async saveInvoice(invoice: Invoice) {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT OR REPLACE INTO invoices (id, invoiceNumber, clientId, dateIssued, taxRate, discountRate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          String(invoice.id),
          String(invoice.invoiceNumber || ''),
          String(invoice.clientId || ''),
          String(invoice.dateIssued || ''),
          Number(invoice.taxRate) || 0,
          Number(invoice.discountRate) || 0,
          String(invoice.notes || ''),
        ]
      );

      await db.runAsync('DELETE FROM invoice_items WHERE invoiceId = ?', [invoice.id]);

      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const freshItemId = `item_${Date.now()}_${i}_${Math.floor(Math.random() * 1000000)}`;
        await db.runAsync(
          'INSERT INTO invoice_items (id, invoiceId, description, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)',
          [
            String(freshItemId),
            String(invoice.id),
            String(item.description || ''),
            Number(item.quantity) || 0,
            Number(item.unitPrice) || 0,
          ]
        );
      }
    });
  },

  async deleteInvoice(id: string) {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM invoice_items WHERE invoiceId = ?', [id]);
      await db.runAsync('DELETE FROM invoices WHERE id = ?', [id]);
    });
  },
};
