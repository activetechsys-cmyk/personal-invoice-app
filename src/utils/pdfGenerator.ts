
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Invoice, Client, BusinessProfile } from '../types';

const getBase64 = async (uri?: string) => {
  if (!uri) return '';
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.error('Error reading image:', e);
    return '';
  }
};

export const generateInvoicePDF = async (profile: BusinessProfile, invoice: Invoice, client: Client) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const discount = subtotal * (invoice.discountRate / 100);
  const total = subtotal + tax - discount;

  const logoBase64 = await getBase64(profile.logoUri);
  const signatureBase64 = await getBase64(profile.signatureUri);

  const html = `
    <html style="-webkit-print-color-adjust: exact;">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 0; 
            margin: 0; 
            color: #111827; 
            line-height: 1.4;
            background-color: white;
          }
          .page { 
            padding: 40px; 
            max-width: 800px; 
            margin: auto; 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 40px; 
          }
          .business-info { 
            display: flex;
            gap: 20px;
            align-items: center;
            font-size: 13px; 
            color: #4B5563; 
          }
          .logo-img { 
            width: 60px; 
            height: 60px; 
            object-fit: contain; 
          }
          .business-details {
            display: flex;
            flex-direction: column;
          }
          .business-name { 
            font-size: 18px; 
            font-weight: 700; 
            color: #111827; 
            margin-bottom: 4px;
            display: block;
          }
          .invoice-title { 
            font-size: 36px; 
            font-weight: 800; 
            color: #3F51B5; 
            text-transform: uppercase; 
            letter-spacing: -1px;
            text-align: right;
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
            font-size: 11px; 
            font-weight: 700; 
            color: #9CA3AF; 
            text-transform: uppercase; 
            margin-bottom: 6px; 
            display: block;
          }
          .info-value { 
            font-size: 14px; 
            color: #1F2937; 
            line-height: 1.6;
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
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            border-bottom: 2px solid #E5E7EB;
          }
          td { 
            padding: 14px 12px; 
            border-bottom: 1px solid #F3F4F6; 
            font-size: 13px; 
          }
          .col-desc { width: 60%; }
          .col-qty { width: 15%; text-align: center; }
          .col-price { width: 15%; text-align: right; }
          .col-total { width: 10%; text-align: right; font-weight: 600; }
          
          .totals-section { 
            display: flex; 
            justify-content: flex-end; 
            margin-bottom: 40px;
          }
          .totals-table { 
            width: 280px; 
            border-collapse: collapse; 
          }
          .totals-row td { 
            padding: 6px 0; 
            font-size: 13px; 
            border: none;
          }
          .total-label { color: #6B7280; }
          .total-value { text-align: right; font-weight: 600; }
          .amount-due-box { 
            background-color: #3F51B5; 
            color: white; 
            padding: 15px; 
            text-align: right; 
            border-radius: 4px;
            margin-top: 10px;
          }
          .amount-due-label { 
            font-size: 12px; 
            text-transform: uppercase; 
            display: block;
            opacity: 0.9;
          }
          .amount-due-value { 
            font-size: 24px; 
            font-weight: 800; 
          }
          .footer { 
            margin-top: 60px; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
            font-size: 11px; 
            color: #9CA3AF; 
            text-align: center; 
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .sig-box {
            width: 200px;
            text-align: center;
            font-size: 12px;
            color: #111827;
          }
          .sig-img {
            width: 120px;
            height: 60px;
            object-fit: contain;
            margin: 0 auto 5px auto;
            display: block;
          }
          .sig-line {
            border-top: 1px solid #111827;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="business-info">
              ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : ''}
              <div class="business-details">
                <span class="business-name">${profile.name}</span>
                ${profile.address}<br/>
                ${profile.email} | ${profile.phone}<br/>
                Tax ID: ${profile.taxId}
              </div>
            </div>
            <div class="invoice-title">Invoice</div>
          </div>

          <div class="info-grid">
            <div class="info-column">
              <span class="info-label">Bill To</span>
              <div class="info-value">
                <strong style="font-size: 16px; color: #111827;">${client.name}</strong><br/>
                ${client.email}<br/>
                ${client.phone}<br/>
                ${client.address}
              </div>
            </div>
            <div class="info-column" style="text-align: right;">
              <span class="info-label">Invoice Details</span>
              <div class="info-value">
                <strong>No:</strong> ${invoice.invoiceNumber}<br/>
                <strong>Issued:</strong> ${invoice.dateIssued}<br/>
                <strong>Due:</strong> ${invoice.dateDue}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-desc">Item</th>
                <th class="col-qty">Qty</th>
                <th class="col-price">Price</th>
                <th class="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td class="col-desc">
                    <div style="font-weight: 600; color: #111827;">${item.description}</div>
                  </td>
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
              ${invoice.taxRate > 0 ? `
              <tr class="totals-row">
                <td class="total-label">Tax (${invoice.taxRate}%)</td>
                <td class="total-value">$${tax.toFixed(2)}</td>
              </tr>` : ''}
              ${invoice.discountRate > 0 ? `
              <tr class="totals-row">
                <td class="total-label">Discount (${invoice.discountRate}%)</td>
                <td class="total-value">-$${discount.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td colspan="2">
                  <div class="amount-due-box">
                    <span class="amount-due-label">Amount Due</span>
                    <span class="amount-due-value">$${total.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          ${invoice.notes ? `
            <div style="margin-top: 40px;">
              <span class="info-label">Notes & Terms</span>
              <div class="info-value" style="font-style: italic; color: #4B5563; font-size: 13px;">${invoice.notes}</div>
            </div>
          ` : ''}

          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line">Customer Signature</div>
            </div>
            <div class="sig-box">
              ${signatureBase64 ? `<img src="${signatureBase64}" class="sig-img" />` : ''}
              <div class="sig-line">Authorized Signature</div>
            </div>
          </div>

          <div class="footer">
            Thank you for your business! Generated via Personal Invoice App.
          </div>
        </div>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};
