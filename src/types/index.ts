
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  invoiceNumber: string;
  dateIssued: string;
  dateDue: string;
  taxRate: number;
  discountRate: number;
  notes: string;
  items: InvoiceItem[];
}

export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  logoUri?: string;
}
