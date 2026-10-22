
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Invoice, Client, BusinessProfile } from '../types';

export const generateInvoicePDF = async (profile: BusinessProfile, invoice: Invoice, client: Client) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const discount = subtotal * (invoice.discountRate / 100);
  const total = subtotal + tax - discount;

  const html = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            padding: 0; 
            margin: 0; 
            color: #1F2937; 
            line-height: 1.5;
          }
          .page { 
            padding: 50px; 
            max-width: 800px; 
            margin: auto; 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 60px; 
          }
          .business-info { 
            font-size: 14px; 
            color: #4B5563; 
          }
          .business-name { 
            font-size: 20px; 
            font-weight: 700; 
            color: #111827; 
            margin-bottom: 4px;
            display: block;
          }
          .invoice-label { 
            font-size: 40px; 
            font-weight: 800; 
            color: #3F51B5; 
            text-transform: uppercase; 
            letter-spacing: -1px;
          }
          .info-grid { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 40px; 
          }
          .info-column { 
            width: 45%; 
          }
          .info-label { 
            font-size: 12px; 
            font-weight: 600; 
            color: #9CA3AF; 
            text-transform: uppercase; 
            margin-bottom: 8px; 
            display: block;
          }
          .info-value { 
            font-size: 15px; 
            color: #1F2937; 
          }
          .invoice-meta-grid {
            margin-top: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 40px; 
          }
          th { 
            background-color: #F9FAFB; 
            color: #6B7280; 
            text-align: left; 
            padding: 12px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
            border-bottom: 2px solid #E5E7EB;
          }
          td { 
            padding: 16px 12px; 
            border-bottom: 1px solid #F3F4F6; 
            font-size: 14px; 
          }
          .col-desc { width: 60%; }
          .col-qty { width: 15%; text-align: center; }
          .col-price { width: 15%; text-align: right; }
          .col-total { width: 10%; text-align: right; font-weight: 600; }
          
          .totals-section { 
            display: flex; 
            justify-content: flex-end; 
          }
          .totals-table { 
            width: 300px; 
            border-collapse: collapse; 
          }
          .totals-row td { 
            padding: 8px 0; 
            font-size: 14px; 
            border: none;
          }
          .total-label { color: #6B7280; }
          .total-value { text-align: right; font-weight: 600; }
          .grand-total-row td { 
            padding: 16px 0 0 0; 
            font-size: 22px; 
            font-weight: 700; 
            color: #3F51B5; 
            border-top: 2px solid #3F51B5; 
          }
          .footer { 
            margin-top: 60px; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
            font-size: 12px; 
            color: #9CA3AF; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="business-info">
              <span class="business-name">${profile.name}</span>
              ${profile.address}<br/>
              ${profile.email} | ${profile.phone}<br/>
              Tax ID: ${profile.taxId}
            </div>
            <div class="invoice-label">Invoice</div>
          </div>

          <div class="info-grid">
            <div class="info-column">
              <span class="info-label">Bill To</span>
              <div class="info-value">
                <strong>${client.name}</strong><br/>
                ${client.email}<br/>
                ${client.phone}<br/>
                ${client.address}
              </div>
            </div>
            <div class="info-column" style="text-align: right;">
              <span class="info-label">Invoice Details</span>
              <div class="info-value">
                <strong>No:</strong> ${invoice.invoiceNumber}<br/>
                <strong>Date:</strong> ${invoice.dateIssued}<br/>
                <strong>Due:</strong> ${invoice.dateDue}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-desc">Description</th>
                <th class="col-qty">Qty</th>
                <th class="col-price">Price</th>
                <th class="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td class="col-desc">${item.description}</td>
                  <td class="col-qty">${item.quantity}</td>
                  <td class="col-price">$${item.unitPrice.toFixed(2)}</td>
                  <td class="col-total">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <table class="totals-table">
              <tr class="totals-row">
                <td class="total-label">Subtotal</td>
                <td class="total-value">$${subtotal.toFixed(2)}</td>
              </tr>
              <tr class="totals-row">
                <td class="total-label">Tax (${invoice.taxRate}%)</td>
                <td class="total-value">$${tax.toFixed(2)}</td>
              </tr>
              <tr class="totals-row">
                <td class="total-label">Discount (${invoice.discountRate}%)</td>
                <td class="total-value">-$${discount.toFixed(2)}</td>
              </tr>
              <tr class="grand-total-row">
                <td class="total-label" style="color: #111827;">Total Amount</td>
                <td class="total-value">$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${invoice.notes ? `
            <div style="margin-top: 40px;">
              <span class="info-label">Notes</span>
              <div class="info-value" style="font-style: italic; color: #6B7280;">${invoice.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            Thank you for your business!
          </div>
        </div>
      </body>
    </html>
  `;

  // First, we try to open the native Print Dialog (Preview/Print)
  // This is the most reliable way to "Preview" on mobile.
  await Print.printAsync({ html });
  
  // Then, we also generate a file and share it as a backup/export option
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};
