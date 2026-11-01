import { BusinessProfile, Client, Invoice } from '../types';

export const getInvoiceHTML = (invoice: any) => {
  // Calculate total since it's not stored in the Invoice interface
  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const discount = subtotal * (invoice.discountRate / 100);
  const total = subtotal + tax - discount;

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset=\"utf-8\">
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; }
          .invoice { border: 1px solid #ccc; padding: 20px; }
          .header { text-align: right; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px solid #ccc; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class=\"invoice\">
          <div class=\"header\">
            <div class=\"bold\">Invoice #${invoice.invoiceNumber}</div>
            <div>Date: ${new Date(invoice.dateIssued).toLocaleDateString()}</div>
          </div>
          <div>
            <div class=\"bold\">Client:</div>
            <div>${invoice.client?.name || 'N/A'}</div>
          </div>
          <div class=\"divider\"></div>
          <div class=\"row bold\">
            <span>Description</span>
            <span>Amount</span>
          </div>
          ${invoice.items.map((item: any) => `
            <div class=\"row\">
              <span>${item.description} (x${item.quantity})</span>
              <span>$${(item.quantity * item.unitPrice).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class=\"divider\"></div>
          <div class=\"row\">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class=\"row\">
            <span>Tax (${invoice.taxRate}%):</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div class=\"row\">
            <span>Discount (${invoice.discountRate}%):</span>
            <span>-$${discount.toFixed(2)}</span>
          </div>
          <div class=\"row bold\" style=\"font-size: 1.2em; margin-top: 10px;\">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
      </body>
    </html>`;
};