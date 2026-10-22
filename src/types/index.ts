
export interface BusinessProfile {
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId: string;
  logoUri?: string;
  signatureUri?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  dateIssued: string;
  
  items: InvoiceItem[];
  taxRate: number;
  discountRate: number;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}
