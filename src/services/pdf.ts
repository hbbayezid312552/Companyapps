import { jsPDF } from 'jspdf';
import { CompanySettings, Invoice } from '../types';
import { formatDateDMY, formatCurrency } from '../utils/formatters';

export function printInvoiceDirect(): void {
  window.print();
}

/**
 * Generate a standalone, professional PDF using jsPDF (works 100% offline, zero network requests)
 */
export function exportInvoicePDF(invoice: Invoice, company: CompanySettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = company.currencySymbol || 'Tk';
  let y = 18;

  // Header - Company Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(24, 43, 73); // Navy Blue
  doc.text(company.name.toUpperCase(), 105, y, { align: 'center' });
  y += 6;

  if (company.tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(company.tagline, 105, y, { align: 'center' });
    y += 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${company.address} | Phone: ${company.phone}`, 105, y, { align: 'center' });
  y += 4;
  if (company.email) {
    doc.text(`Email: ${company.email}`, 105, y, { align: 'center' });
    y += 6;
  } else {
    y += 4;
  }

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 6;

  // Invoice Title Bar
  doc.setFillColor(30, 58, 138); // Dark Blue
  doc.roundedRect(14, y, 182, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('COMMERCIAL INVOICE / বিল চালান', 105, y + 5.5, { align: 'center' });
  y += 13;

  // Info Box (Invoice metadata + Dealer details)
  const infoBoxStartY = y;
  doc.setFontSize(8.5);

  // Left column: Dealer Info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('BILLED TO (DEALER INFO):', 16, y);
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(invoice.dealerName || 'Valued Dealer', 16, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (invoice.dealerPhone) {
    doc.text(`Mobile: ${invoice.dealerPhone}`, 16, y);
    y += 4;
  }
  if (invoice.dealerAddress) {
    const addressLines = doc.splitTextToSize(`Address: ${invoice.dealerAddress}`, 88);
    doc.text(addressLines, 16, y);
    y += addressLines.length * 4;
  }

  // Right column: Invoice Metadata
  let rightY = infoBoxStartY;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('INVOICE DETAILS:', 125, rightY);
  rightY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No:`, 125, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoiceNo, 160, rightY);
  rightY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Date:`, 125, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateDMY(invoice.date), 160, rightY);
  rightY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Method:`, 125, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.paymentMethod || 'Cash', 160, rightY);
  rightY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Status:`, 125, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(invoice.paymentStatus === 'paid' ? 16 : 220, invoice.paymentStatus === 'paid' ? 185 : 38, invoice.paymentStatus === 'paid' ? 129 : 38);
  doc.text(invoice.paymentStatus.toUpperCase(), 160, rightY);

  y = Math.max(y, rightY) + 6;

  // Table Header
  const colX = [14, 26, 92, 110, 130, 148, 172];
  // Columns: SL (14), Product (26), Qty (92), MRP (110), % (130), Dealer Price (148), Total (172)
  doc.setFillColor(241, 245, 249); // light slate
  doc.rect(14, y, 182, 7.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 7.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('SL', 16, y + 5);
  doc.text('PRODUCT NAME', 28, y + 5);
  doc.text('QTY', 100, y + 5, { align: 'right' });
  doc.text('MRP PRICE', 124, y + 5, { align: 'right' });
  doc.text('% DISC', 142, y + 5, { align: 'right' });
  doc.text('DLR PRICE', 166, y + 5, { align: 'right' });
  doc.text('TOTAL', 192, y + 5, { align: 'right' });

  y += 7.5;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  invoice.items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 6.5, 196, y + 6.5);

    doc.setTextColor(51, 65, 85);
    doc.text(String(idx + 1), 16, y + 4.5);

    const nameText = doc.splitTextToSize(item.productName, 62)[0]; // single line clamp
    doc.text(nameText, 28, y + 4.5);

    doc.text(String(item.quantity), 100, y + 4.5, { align: 'right' });
    doc.text(item.mrpPrice.toFixed(2), 124, y + 4.5, { align: 'right' });
    doc.text(`${item.percent}%`, 142, y + 4.5, { align: 'right' });
    doc.text(item.dealerPrice.toFixed(2), 166, y + 4.5, { align: 'right' });
    doc.text(item.total.toFixed(2), 192, y + 4.5, { align: 'right' });

    y += 6.5;
  });

  y += 4;

  // Summary Table (Bottom Right)
  const sumXLabel = 120;
  const sumXVal = 192;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Gross MRP Total:', sumXLabel, y);
  doc.text(`${currency} ${invoice.grossAmount.toFixed(2)}`, sumXVal, y, { align: 'right' });
  y += 4.5;

  doc.text('Total Dealer Discount:', sumXLabel, y);
  doc.setTextColor(220, 38, 38);
  doc.text(`- ${currency} ${invoice.totalDiscount.toFixed(2)}`, sumXVal, y, { align: 'right' });
  y += 5;

  // Highlight Box for Net Payable
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(sumXLabel - 4, y - 3.5, 80, 7.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('NET PAYABLE AMOUNT:', sumXLabel, y + 1.5);
  doc.text(`${currency} ${invoice.netPayable.toFixed(2)}`, sumXVal, y + 1.5, { align: 'right' });
  y += 8.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 149, 100);
  doc.text('Paid Amount:', sumXLabel, y);
  doc.text(`${currency} ${invoice.paidAmount.toFixed(2)}`, sumXVal, y, { align: 'right' });
  y += 4.5;

  doc.setTextColor(invoice.dueAmount > 0 ? 185 : 100, invoice.dueAmount > 0 ? 28 : 116, invoice.dueAmount > 0 ? 28 : 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Due Balance:', sumXLabel, y);
  doc.text(`${currency} ${invoice.dueAmount.toFixed(2)}`, sumXVal, y, { align: 'right' });
  y += 8;

  // Notes & Terms (Left bottom)
  if (invoice.notes || company.termsAndConditions) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('NOTES & TERMS:', 14, y - 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const noteText = invoice.notes ? `Note: ${invoice.notes}` : 'Thank you for your business!';
    doc.text(doc.splitTextToSize(noteText, 95), 14, y - 13);
  }

  // Signature Boxes (Required: Two side-by-side boxes for Chairman & Dealer)
  const sigY = 245;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Left Signature: Company Chairman
  doc.line(18, sigY + 14, 85, sigY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.chairmanSignatureTitle || 'Company Chairman Signature', 51.5, sigY + 19, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(company.name, 51.5, sigY + 23, { align: 'center' });

  // Right Signature: Receiving Dealer
  doc.line(125, sigY + 14, 192, sigY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.dealerSignatureTitle || 'Receiving Dealer Signature', 158.5, sigY + 19, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Seal & Date)', 158.5, sigY + 23, { align: 'center' });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by Smart Invoice Manager • Offline First System • Date: ${formatDateDMY(new Date().toISOString().split('T')[0])}`,
    105,
    286,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`${invoice.invoiceNo}.pdf`);
}
