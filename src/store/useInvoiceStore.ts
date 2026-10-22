import { create } from 'zustand';
import { Invoice, InvoiceItem, InvoiceDraft, Client, BusinessProfile } from '../types';
import { DBManager } from '../db/manager';

interface InvoiceState {
  profile: BusinessProfile;
  clients: Client[];
  currentInvoice: InvoiceDraft;
  setProfile: (profile: BusinessProfile) => void;
  setCurrentClient: (client: Client | null) => void;
  applyInvoiceTemplate: (invoice: Invoice) => void;
  updateInvoiceField: <K extends keyof Omit<InvoiceDraft, 'client' | 'items'>>(
    field: K,
    value: InvoiceDraft[K]
  ) => void;
  addItem: () => void;
  updateItem: <K extends keyof InvoiceItem>(index: number, field: K, value: InvoiceItem[K]) => void;
  removeItem: (index: number) => void;
  resetInvoice: () => Promise<void>;
  initializeStore: () => Promise<void>;
  loadClients: () => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  saveCurrentInvoice: () => Promise<string>;
}

const today = () => new Date().toISOString().split('T')[0];

const emptyDraft = (invoiceNumber: string): InvoiceDraft => ({
  client: null,
  invoiceNumber,
  dateIssued: today(),
  items: [],
  taxRate: 0,
  discountRate: 0,
  notes: '',
});

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  profile: {
    name: 'My Business',
    email: 'contact@business.com',
    phone: '+1 234 567 890',
    address: '123 Main St, City, Country',
    taxId: 'TAX-123456789',
  },
  clients: [],
  currentInvoice: emptyDraft('INV-0001'),
  setProfile: (profile) => set({ profile }),
  setCurrentClient: (client) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, client },
  })),
  applyInvoiceTemplate: (invoice) => {
    const { clients, currentInvoice } = get();
    const client =
      clients.find((c) => c.id === invoice.clientId) ??
      currentInvoice.client;

    set({
      currentInvoice: {
        client,
        invoiceNumber: currentInvoice.invoiceNumber,
        dateIssued: invoice.dateIssued || today(),
        items: invoice.items.map((item) => ({ ...item })),
        taxRate: invoice.taxRate,
        discountRate: invoice.discountRate,
        notes: invoice.notes || '',
      },
    });
  },
  updateInvoiceField: (field, value) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, [field]: value },
  })),
  addItem: () => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: [
        ...state.currentInvoice.items,
        { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 },
      ],
    },
  })),
  updateItem: (index, field, value) => set((state) => {
    const newItems = [...state.currentInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    return {
      currentInvoice: { ...state.currentInvoice, items: newItems },
    };
  }),
  removeItem: (index) => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: state.currentInvoice.items.filter((_, i) => i !== index),
    },
  })),
  resetInvoice: async () => {
    const nextNum = await DBManager.getNextInvoiceNumber();
    set({ currentInvoice: emptyDraft(nextNum) });
  },
  loadClients: async () => {
    const clients = await DBManager.getClients();
    set({ clients });
  },
  saveClient: async (client) => {
    await DBManager.saveClient(client);
    await get().loadClients();
  },
  deleteClient: async (id) => {
    await DBManager.deleteClient(id);
    const { currentInvoice } = get();
    if (currentInvoice.client?.id === id) {
      set({ currentInvoice: { ...currentInvoice, client: null } });
    }
    await get().loadClients();
  },
  saveCurrentInvoice: async () => {
    const { currentInvoice } = get();
    if (!currentInvoice.client) {
      throw new Error('Please select a client');
    }
    if (currentInvoice.items.length === 0) {
      throw new Error('Add at least one item');
    }

    const { invoiceNumber } = await DBManager.createInvoice(
      {
        clientId: currentInvoice.client.id,
        dateIssued: currentInvoice.dateIssued,
        taxRate: currentInvoice.taxRate,
        discountRate: currentInvoice.discountRate,
        notes: currentInvoice.notes,
      },
      currentInvoice.items
    );

    const nextNum = await DBManager.getNextInvoiceNumber();
    set({ currentInvoice: emptyDraft(nextNum) });
    return invoiceNumber;
  },
  initializeStore: async () => {
    const [profile, clients, nextNum] = await Promise.all([
      DBManager.getProfile(),
      DBManager.getClients(),
      DBManager.getNextInvoiceNumber(),
    ]);

    const { currentInvoice } = get();
    const isBlank = !currentInvoice.client && currentInvoice.items.length === 0;

    set({
      profile: profile.name ? profile : get().profile,
      clients,
      currentInvoice: isBlank
        ? emptyDraft(nextNum)
        : { ...currentInvoice, invoiceNumber: currentInvoice.invoiceNumber || nextNum },
    });
  },
}));
