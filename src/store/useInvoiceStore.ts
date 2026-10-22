
import { create } from 'zustand';
import { Invoice, InvoiceItem, Client, BusinessProfile } from '../types';
import { DBManager } from '../db/manager';

interface InvoiceState {
  profile: BusinessProfile;
  currentInvoice: {
    client: Client | null;
    invoiceNumber: string;
    dateIssued: string;
    items: InvoiceItem[];
    taxRate: number;
    discountRate: number;
    notes: string;
  };
  setProfile: (profile: BusinessProfile) => void;
  setCurrentClient: (client: Client) => void;
  setCurrentInvoice: (invoice: any) => void;
  updateInvoiceField: (field: string, value: any) => void;
  addItem: () => void;
  updateItem: (index: number, field: keyof InvoiceItem, value: any) => void;
  removeItem: (index: number) => void;
  resetInvoice: () => void;
  initializeStore: () => Promise<void>;
  incrementInvoiceNumber: () => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  profile: {
    name: 'My Business',
    email: 'contact@business.com',
    phone: '+1 234 567 890',
    address: '123 Main St, City, Country',
    taxId: 'TAX-123456789',
  },
  currentInvoice: {
    client: null,
    invoiceNumber: '000001',
    dateIssued: new Date().toISOString().split('T')[0],
    items: [],
    taxRate: 0,
    discountRate: 0,
    notes: '',
  },
  setProfile: (profile) => set({ profile }),
  setCurrentClient: (client) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, client }
  })),
  setCurrentInvoice: (invoice) => set((state) => ({
    currentInvoice: { ...invoice }
  })),
  updateInvoiceField: (field, value) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, [field]: value }
  })),
  addItem: () => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: [...state.currentInvoice.items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]
    }
  })),
  updateItem: (index, field, value) => set((state) => {
    const newItems = [...state.currentInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    return {
      currentInvoice: { ...state.currentInvoice, items: newItems }
    };
  }),
  removeItem: (index) => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: state.currentInvoice.items.filter((_, i) => i !== index)
    }
  })),
  resetInvoice: async () => {
    const lastNum = await DBManager.getLastInvoiceNumber();
    const nextNum = (parseInt(lastNum) + 1 || 1).toString().padStart(6, '0');
    set({
      currentInvoice: {
        client: null,
        invoiceNumber: nextNum,
        dateIssued: new Date().toISOString().split('T')[0],
        items: [],
        taxRate: 0,
        discountRate: 0,
        notes: '',
      }
    });
  },
  incrementInvoiceNumber: async () => {
    const currentNum = get().currentInvoice.invoiceNumber;
    await DBManager.setLastInvoiceNumber(currentNum);
  },
  initializeStore: async () => {
    const profile = await DBManager.getProfile();
    const lastNum = await DBManager.getLastInvoiceNumber();
    const nextNum = (parseInt(lastNum) + 1 || 1).toString().padStart(6, '0');
    
    set({ 
      profile,
      currentInvoice: {
        ...get().currentInvoice,
        invoiceNumber: nextNum,
        dateIssued: new Date().toISOString().split('T')[0],
      }
    });
  }
}));
