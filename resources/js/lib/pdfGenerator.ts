import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Party, FinishedProduct, CuttingRecord, ProductionRecord, FabricLot } from '../types';

export const COMPANY_INFO = {
  name: 'Zartab Fatima Collection',
  address: 'Sheikhupura Road, Near Gatwala Toll Plaza, Faisalabad',
  phone: '0300-8651451',
};

export const PDFGenerator = {
  generateLotDetailReportPDF: (
    lots: FabricLot[],
    periodText: string,
    companyInfo?: { name?: string; address?: string; phone?: string }
  ) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const companyName = companyInfo?.name || COMPANY_INFO.name;
    const companyAddress = companyInfo?.address || COMPANY_INFO.address;
    const companyPhone = companyInfo?.phone || COMPANY_INFO.phone;

    const formatMeters = (value: number) => `${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;

    const addPageHeader = (lotIndex: number, totalLots: number) => {
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, 14, 16);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${companyAddress} | Ph: ${companyPhone}`, 14, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Lot Report ${lotIndex + 1}/${totalLots}`, 154, 16);
      doc.text(`${periodText}`, 163, 22, { align: 'right' });
    };

    lots.forEach((lot, lotIndex) => {
      if (lotIndex > 0) doc.addPage();
      addPageHeader(lotIndex, lots.length);

      let totalFront = 0;
      let totalReverse = 0;
      lot.designs.forEach((design) => {
        totalFront += Number(design.frontMeters || 0);
        totalReverse += Number(design.reverseMeters || 0);
      });
      const totalMeters = totalFront + totalReverse;

      let y = 36;
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('LOT DETAILS', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Lot No:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.lotNumber || 'N/A', 42, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Supplier:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.supplierName || 'N/A', 135, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Date Received:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.dateReceived || 'N/A', 48, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Designs:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(lot.designs?.length || 0), 136, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Rate / Meter:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.ratePerMeter ? `${lot.ratePerMeter.toFixed(2)}` : 'N/A', 48, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Cost:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.totalCost ? `${lot.totalCost.toFixed(2)}` : 'N/A', 138, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Payment Status:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.paymentStatus || 'Unpaid', 48, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Amount Paid:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.amountPaid ? `${lot.amountPaid.toFixed(2)}` : '0.00', 138, y);
      y += 8;

      doc.setFillColor(243, 244, 246);
      doc.roundedRect(12, y - 3, 186, 18, 2, 2, 'F');

      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Summary', 18, y + 7);

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');

      const summaryY = y + 7;
      const frontText = `Front: ${formatMeters(totalFront)}`;
      const reverseText = `Reverse: ${formatMeters(totalReverse)}`;
      const totalText = `Total: ${formatMeters(totalMeters)}`;

      const reverseWidth = doc.getTextWidth(reverseText);
      const totalWidth = doc.getTextWidth(totalText);
      const frontWidth = doc.getTextWidth(frontText);

      const totalStartX = 200 - totalWidth;
      const reverseStartX = Math.max(110, totalStartX - reverseWidth - 8);
      const frontStartX = Math.max(18, reverseStartX - frontWidth - 10);

      doc.text(frontText, frontStartX, summaryY);
      doc.text(reverseText, reverseStartX, summaryY);
      doc.text(totalText, totalStartX, summaryY);
      y += 18;

      autoTable(doc, {
        startY: y,
        head: [['Design #', 'Design Name', 'Type', 'Front (m)', 'Reverse (m)', 'Total (m)']],
        body: lot.designs.length
          ? lot.designs.map((design) => {
            const front = Number(design.frontMeters || 0);
            const reverse = Number(design.reverseMeters || 0);
            return [
              design.designNumber || 'N/A',
              design.designName || '-',
              design.fabricType || 'bedsheet_set',
              front.toFixed(2),
              reverse.toFixed(2),
              (front + reverse).toFixed(2),
            ];
          })
          : [['N/A', 'No designs captured', '-', '0.00', '0.00', '0.00']],
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 60 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 24, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 20;
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Supplier Address:', 14, finalY + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.supplierAddress || 'Not provided', 42, finalY + 8, { maxWidth: 140 });

      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, finalY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.notes || 'No lot notes available.', 32, finalY + 15, { maxWidth: 160 });

      doc.setFont('helvetica', 'bold');
      doc.text('Payment Notes:', 14, finalY + 22);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.paymentNotes || 'No payment notes.', 42, finalY + 22, { maxWidth: 150 });
    });

    doc.save(`Fabric_Lot_Detail_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  },

  generateInvoicePDF: (invoice: Invoice, companyInfo?: { name?: string; address?: string; phone?: string }) => {
    const doc = new jsPDF();

    const companyName = companyInfo?.name || COMPANY_INFO.name;
    const companyAddress = companyInfo?.address || COMPANY_INFO.address;
    const companyPhone = companyInfo?.phone || COMPANY_INFO.phone;

    // Primary Header Background Bar
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 32, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companyAddress} | Ph: ${companyPhone}`, 14, 26);

    // Invoice Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 160, 45);

    // Invoice Meta Info Box
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No:`, 130, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.invoiceNumber}`, 165, 55);

    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Date:`, 130, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.date}`, 165, 62);

    doc.setFont('helvetica', 'bold');
    doc.text(`Due Date:`, 130, 69);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.dueDate}`, 165, 69);

    doc.setFont('helvetica', 'bold');
    doc.text(`Status:`, 130, 76);
    doc.setFont('helvetica', 'bold');
    if (invoice.status === 'Paid') {
      doc.setTextColor(16, 185, 129);
    } else if (invoice.status === 'Partially Paid') {
      doc.setTextColor(245, 158, 11);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`${invoice.status.toUpperCase()}`, 165, 76);

    // Customer Info Box
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 14, 45);

    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.partyName, 14, 52);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Address: ${invoice.partyAddress || 'N/A'}`, 14, 59);
    doc.text(`Phone: ${invoice.partyPhone || 'N/A'}`, 14, 66);

    // Horizontal Divider Line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 82, 196, 82);

    const curr = invoice.currencySymbol || 'Rs.';

    // Table of Items
    const tableData = invoice.items.map((item, index) => {
      let desc = item.productName;
      if (item.frontMeters !== undefined || item.reverseMeters !== undefined) {
        desc += `\n(Front: ${item.frontMeters || 0}m, Reverse: ${item.reverseMeters || 0}m)`;
      }
      return [
        (index + 1).toString(),
        desc,
        item.designNumber || '-',
        item.quantity.toString(),
        `${curr} ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${curr} ${item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ];
    });

    autoTable(doc, {
      startY: 88,
      head: [['#', 'Item Description', 'Design #', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
    });

    // Totals Calculation Box
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150;

    const summaryX = 120;
    let currentY = finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    doc.text('Subtotal:', summaryX, currentY);
    doc.text(`${curr} ${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });

    if (invoice.discountAmount > 0) {
      currentY += 7;
      doc.text('Discount:', summaryX, currentY);
      doc.text(`-${curr} ${invoice.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });
    }

    if (invoice.taxAmount > 0) {
      currentY += 7;
      doc.text(`Tax (${invoice.taxRatePercent}%):`, summaryX, currentY);
      doc.text(`+${curr} ${invoice.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });
    }

    currentY += 8;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(summaryX, currentY - 4, 196, currentY - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Grand Total:', summaryX, currentY);
    doc.text(`${curr} ${invoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });

    currentY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Amount Paid:', summaryX, currentY);
    doc.text(`${curr} ${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Balance Due:', summaryX, currentY);
    doc.text(`${curr} ${invoice.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });

    // Terms & Signatures
    const bottomY = Math.max(currentY + 25, 230);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Terms & Conditions:', 14, bottomY);
    doc.text('1. All items checked before dispatch.', 14, bottomY + 4);
    doc.text('2. Payments due within terms stated on invoice.', 14, bottomY + 8);
    doc.text('3. Authorized Computer Generated Document.', 14, bottomY + 12);

    doc.line(140, bottomY + 10, 196, bottomY + 10);
    doc.text('Authorized Signatory', 150, bottomY + 15);

    // Save File
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  },

  generateGeneralReportPDF: (
    title: string,
    periodText: string,
    headers: string[],
    rows: (string | number)[][],
    summaryStats?: { label: string; value: string }[]
  ) => {
    const doc = new jsPDF();

    // Top Navy Bar
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Textile & Quilt Manufacturing ERP', 14, 16);

    // Title & Subtitle
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(15);
    doc.text(title.toUpperCase(), 14, 35);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${periodText} | Generated: ${new Date().toLocaleString()}`, 14, 42);

    let startY = 48;

    // Summary Stat Badges
    if (summaryStats && summaryStats.length > 0) {
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(14, 46, 182, 16, 'F');

      let statX = 20;
      doc.setFontSize(8);
      summaryStats.forEach((stat) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(stat.label.toUpperCase(), statX, 52);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(10);
        doc.text(stat.value, statX, 58);

        statX += 45;
      });

      startY = 68;
    }

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: rows.map((r) => r.map((c) => String(c))),
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
    });

    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
  },
};
