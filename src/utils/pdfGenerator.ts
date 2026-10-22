import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { BusinessProfile, Invoice, Client } from '../types';

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(amount: number) {
  const abs = Math.abs(amount).toFixed(2);
  return amount < 0 ? `-$${abs}` : `$${abs}`;
}

function imageMime(uri?: string | null) {
  const lower = (uri || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

async function getBase64(uri: string | null | undefined) {
  if (!uri) return '';
  try {
    if (FileSystem && typeof FileSystem.readAsStringAsync === 'function') {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    return '';
  } catch (e) {
    console.error('Error reading image for PDF:', e);
    return '';
  }
}

export const generateInvoicePDF = async (profile: BusinessProfile, invoice: Invoice, client: Client) => {
  const logoBase64 = await getBase64(profile.logoUri);
  const signatureBase64 = await getBase64(profile.signatureUri);

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const discount = subtotal * (invoice.discountRate / 100);
  const total = subtotal + tax - discount;
  const notes = (invoice.notes || '').trim();
  const taxId = (profile.taxId || '').trim();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          @page {
            margin: 0.6in;
            size: letter;
          }

          * { box-sizing: border-box; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
            font-size: 14px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 36px;
            padding-bottom: 24px;
            border-bottom: 2px solid #3F51B5;
          }

          .company-info { text-align: left; max-width: 58%; }
          .company-name { font-weight: 700; font-size: 20px; letter-spacing: -0.02em; margin-bottom: 4px; }
          .company-meta { font-size: 12px; color: #6B7280; line-height: 1.55; }
          .tax-id { margin-top: 8px; font-size: 12px; color: #374151; font-weight: 500; }

          .invoice-title { text-align: right; color: #3F51B5; }
          .invoice-kicker {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #6366F1;
            margin-bottom: 4px;
          }
          .invoice-heading { font-size: 32px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }

          .logo { max-width: 150px; max-height: 80px; margin-bottom: 16px; display: block; }

          .details-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 32px;
            margin-bottom: 32px;
          }

          .details-box { width: 48%; }
          .details-box.meta { text-align: right; }

          .details-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .details-value { margin-bottom: 2px; font-size: 14px; color: #111827; }
          .details-value.muted { color: #6B7280; font-size: 13px; }
          .client-name { font-weight: 600; font-size: 16px; margin-bottom: 4px; }

          .meta-table { width: 100%; border-collapse: collapse; }
          .meta-table td { padding: 4px 0; font-size: 13px; border: 0; }
          .meta-table .meta-key { color: #6B7280; text-align: right; padding-right: 12px; width: 48%; }
          .meta-table .meta-val { color: #111827; font-weight: 600; text-align: right; }
          .status-pill {
            display: inline-block;
            background: #EEF2FF;
            color: #3F51B5;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 999px;
          }

          table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            table-layout: fixed;
          }

          table.items th {
            background: #3F51B5;
            color: #ffffff;
            padding: 12px 14px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          table.items th:first-child { border-radius: 8px 0 0 0; text-align: left; width: 52%; }
          table.items th.num { text-align: right; }
          table.items th:nth-child(2) { width: 12%; }
          table.items th:nth-child(3),
          table.items th:nth-child(4) { width: 18%; }
          table.items th:last-child { border-radius: 0 8px 0 0; }

          table.items td {
            padding: 12px 14px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 14px;
            color: #111827;
            vertical-align: top;
          }

          table.items td.num {
            text-align: right;
            font-variant-numeric: tabular-nums;
            color: #374151;
          }

          table.items tbody tr:nth-child(even) td { background: #F9FAFB; }

          .total-section { display: flex; justify-content: flex-end; margin-bottom: 28px; }

          table.totals {
            width: 280px;
            border-collapse: collapse;
          }

          table.totals td {
            padding: 8px 0;
            font-size: 14px;
            border-bottom: 1px solid #F3F4F6;
          }

          table.totals td.label { color: #6B7280; text-align: left; }
          table.totals td.num {
            text-align: right;
            font-variant-numeric: tabular-nums;
            font-weight: 500;
            color: #111827;
          }

          table.totals tr.grand td {
            border-bottom: 0;
            border-top: 2px solid #3F51B5;
            padding-top: 12px;
            font-size: 18px;
            font-weight: 700;
            color: #3F51B5;
          }

          .notes {
            margin-top: 8px;
            padding: 14px 16px;
            background: #F9FAFB;
            border-left: 3px solid #3F51B5;
            border-radius: 0 6px 6px 0;
            font-size: 13px;
            color: #374151;
            font-style: normal;
          }

          .notes-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6B7280;
            margin-bottom: 4px;
            font-style: normal;
          }

          .footer {
            margin-top: 48px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 24px;
          }

          .thanks {
            font-size: 12px;
            color: #6B7280;
            max-width: 55%;
          }

          .signature-box { text-align: center; width: 220px; }
          .signature-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6B7280;
            margin-bottom: 10px;
          }
          .signature-img { max-width: 160px; max-height: 64px; display: block; margin: 0 auto 6px; }
          .signature-line { height: 60px; border-bottom: 1px solid #D1D5DB; margin-bottom: 6px; }
          .signer-name { font-size: 12px; color: #374151; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${logoBase64 ? `<img src="data:${imageMime(profile.logoUri)};base64,${logoBase64}" class="logo" />` : ''}
            <div class="company-name">${escapeHtml(profile.name)}</div>
            <div class="company-meta">${escapeHtml(profile.address)}</div>
            <div class="company-meta">${escapeHtml(profile.email)}${profile.phone ? ` · ${escapeHtml(profile.phone)}` : ''}</div>
            ${taxId ? `<div class="tax-id">Tax ID: ${escapeHtml(taxId)}</div>` : ''}
          </div>
          <div class="invoice-title">
            <div class="invoice-kicker">Invoice</div>
            <div class="invoice-heading">#${escapeHtml(invoice.invoiceNumber)}</div>
          </div>
        </div>

        <div class="details-section">
          <div class="details-box">
            <div class="details-label">Bill To</div>
            <div class="details-value client-name">${escapeHtml(client.name)}</div>
            ${client.address ? `<div class="details-value muted">${escapeHtml(client.address)}</div>` : ''}
            ${client.email ? `<div class="details-value muted">${escapeHtml(client.email)}</div>` : ''}
            ${client.phone ? `<div class="details-value muted">${escapeHtml(client.phone)}</div>` : ''}
          </div>
          <div class="details-box meta">
            <div class="details-label">Invoice Details</div>
            <table class="meta-table">
              <tr>
                <td class="meta-key">Invoice No.</td>
                <td class="meta-val">${escapeHtml(invoice.invoiceNumber)}</td>
              </tr>
              <tr>
                <td class="meta-key">Date Issued</td>
                <td class="meta-val">${escapeHtml(invoice.dateIssued)}</td>
              </tr>
              <tr>
                <td class="meta-key">Status</td>
                <td class="meta-val"><span class="status-pill">Issued</span></td>
              </tr>
            </table>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>Description</th>
              <th class="num">Qty</th>
              <th class="num">Price</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${escapeHtml(item.description)}</td>
                <td class="num">${escapeHtml(item.quantity)}</td>
                <td class="num">${formatMoney(item.unitPrice)}</td>
                <td class="num">${formatMoney(item.quantity * item.unitPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <table class="totals">
            <tr>
              <td class="label">Subtotal</td>
              <td class="num">${formatMoney(subtotal)}</td>
            </tr>
            ${invoice.taxRate > 0 ? `
            <tr>
              <td class="label">Tax (${escapeHtml(invoice.taxRate)}%)</td>
              <td class="num">${formatMoney(tax)}</td>
            </tr>` : ''}
            ${invoice.discountRate > 0 ? `
            <tr>
              <td class="label">Discount (${escapeHtml(invoice.discountRate)}%)</td>
              <td class="num">${formatMoney(-discount)}</td>
            </tr>` : ''}
            <tr class="grand">
              <td class="label">Total</td>
              <td class="num">${formatMoney(total)}</td>
            </tr>
          </table>
        </div>

        ${notes ? `
        <div class="notes">
          <span class="notes-label">Notes</span>
          ${escapeHtml(notes)}
        </div>` : ''}

        <div class="footer">
          <div class="thanks">Thank you for your business.</div>
          <div class="signature-box">
            <div class="signature-label">Authorized Signature</div>
            ${signatureBase64
              ? `<img src="data:${imageMime(profile.signatureUri)};base64,${signatureBase64}" class="signature-img" />`
              : '<div class="signature-line"></div>'}
            ${profile.name ? `<div class="signer-name">${escapeHtml(profile.name)}</div>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};
