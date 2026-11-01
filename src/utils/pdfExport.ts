import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { getInvoiceHTML } from './invoiceTemplate';

/**
 * Exports an invoice to PDF and shares it.
 * 
 * FIX for 'java.io.IOException: Location... isn't readable':
 * On some Android versions, Print.printToFileAsync generates a file that is immediately 
 * locked or restricted. Instead of copying the file, we generate the PDF as a Base64 
 * string, then write that string directly to the document directory.
 */
export const exportInvoiceAsPDF = async (invoice: any) => {
  const html = getInvoiceHTML(invoice);
  
  try {
    // 1. Generate the PDF as a Base64 string instead of a file
    // This completely bypasses the 'isn't readable' IOException because we never touch the cache file
    const { base64 } = await Print.printToFileAsync({ 
      html, 
      base64: true 
    });

    if (!base64) {
      throw new Error('PDF generation failed: Base64 output is empty');
    }

    // 2. Define a destination path in the app's persistent document directory
    const docDir = (FileSystem as any).documentDirectory;
    const safeUri = `${docDir}invoice_${invoice.invoice_number}.pdf`;

    // 3. Write the Base64 string directly to the destination file
    await FileSystem.writeAsStringAsync(safeUri, base64, { 
      encoding: FileSystem.EncodingType.Base64 
    });

    // 4. Trigger the native OS share sheet using the safe URI
    await Sharing.shareAsync(safeUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share Invoice #${invoice.invoice_number}`
    });

    console.log(`PDF successfully written to ${safeUri} and shared.`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};