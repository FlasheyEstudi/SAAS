/**
 * Export utilities for Excel and PDF with professional templates
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils/format';

// ============================================================
// Excel Export with Professional Templates
// ============================================================

interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  company?: string;
  period?: string;
  generatedDate?: Date;
}

/**
 * Export data to Excel with a professional formatted template
 */
export async function exportToExcelTemplate(options: ExcelExportOptions): Promise<void> {
  const {
    filename,
    sheetName = 'Reporte',
    title = 'Reporte',
    subtitle = '',
    headers,
    data,
    company = '',
    period = '',
    generatedDate = new Date(),
  } = options;

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GANESHA';
    workbook.created = generatedDate;

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 4 }], // Freeze title + header
      properties: { tabColor: { argb: 'FF6B5B95' } },
    });

    // Branding Colors
    const PRIMARY_COLOR = 'FF4A3F7F';
    const SECONDARY_COLOR = 'FF6B5B95';
    const LIGHT_BG = 'FFF9F9FB';
    const BORDER_COLOR = 'FFE0D8F0';

    // Title Section
    worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title.toUpperCase();
    titleCell.style = {
      font: { name: 'Georgia', size: 22, bold: true, color: { argb: PRIMARY_COLOR } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    worksheet.getRow(1).height = 40;

    // Subtitle Section
    const subText = [company, period, subtitle].filter(Boolean).join(' | ');
    worksheet.mergeCells(`A2:${String.fromCharCode(64 + headers.length)}2`);
    const subCell = worksheet.getCell('A2');
    subCell.value = subText;
    subCell.style = {
      font: { name: 'Arial', size: 11, italic: true, color: { argb: 'FF80739E' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    worksheet.getRow(2).height = 20;

    // Extra spacing row
    worksheet.addRow([]);
    worksheet.getRow(3).height = 10;

    // Header styling
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.style = {
        font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: SECONDARY_COLOR } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: PRIMARY_COLOR } },
          bottom: { style: 'medium', color: { argb: PRIMARY_COLOR } },
        }
      };
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: headers.length }
    };

    // Data rows
    data.forEach((rowData, index) => {
      const row = worksheet.addRow(rowData);
      row.height = 22;
      const isAlt = (index + 1) % 2 === 0;

      row.eachCell((cell) => {
        const value = cell.value;
        const isNum = typeof value === 'number';

        cell.style = {
          font: { name: 'Arial', size: 10, color: { argb: 'FF333333' } },
          fill: isAlt ? { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } } : undefined,
          alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'middle' },
          border: { bottom: { style: 'thin', color: { argb: BORDER_COLOR } } },
          numFmt: isNum ? '#,##0.00' : undefined // Basic numeric format
        };

        // Specific NIO formatting for numbers
        if (isNum) {
          cell.numFmt = '"C$" #,##0.00;[Red]"C$" -#,##0.00';
        }
      });
    });

    // Auto-fit columns
    worksheet.columns?.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      column.width = Math.min(maxLen + 4, 60);
    });

    // Generate
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw error;
  }
}

/**
 * Professional PDF Export Logic
 */
interface PDFExportOptions {
  filename: string;
  title: string;
  company: string;
  period?: string;
  headers: string[];
  data: any[][];
  orientation?: 'p' | 'l';
}

export async function exportToPDFTemplate(options: PDFExportOptions): Promise<void> {
  const { filename, title, company, period, headers, data, orientation = 'p' } = options;
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const PRIMARY_COLOR = [107, 91, 149]; // #6B5B95
  const TEXT_COLOR = [74, 63, 127];    // #4A3F7F

  // Header Context
  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw Logo Box (Placeholder)
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.roundedRect(14, 15, 12, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('G', 17, 24);

  // Company and Report Info
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text(company.toUpperCase(), 30, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 30, 26);
  if (period) doc.text(period, 30, 31);

  // Horizontal Line
  doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 35, pageWidth - 14, 35);

  // Table Generation
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { 
      fillColor: PRIMARY_COLOR as any, 
      textColor: [255, 255, 255], 
      fontSize: 10, 
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 9, 
      textColor: [51, 51, 51],
      cellPadding: 3
    },
    alternateRowStyles: { fillColor: [249, 249, 251] },
    columnStyles: {
      // Right align numbers (assumes last columns are numbers)
      ...headers.reduce((acc, _, i) => {
        // If data looks like a number/currency, right align
        const sample = data[0]?.[i];
        if (typeof sample === 'number' || (typeof sample === 'string' && /^[C\$]?\s?[\d,.]+$/.test(sample))) {
          // @ts-ignore
          acc[i] = { halign: 'right' };
        }
        return acc;
      }, {})
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (dataArg) => {
      // Footer
      const str = `Página ${dataArg.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, dataArg.settings.margin.left, pageHeight - 10);
      doc.text(`Generado por GANESHA - ${new Date().toLocaleString()}`, pageWidth - dataArg.settings.margin.right, pageHeight - 10, { align: 'right' });
    }
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Simple CSV export (fallback)
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = headers || Object.keys(data[0]);
  const csvRows = [
    keys.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key] ?? '';
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

// ============================================================
// Report-specific exports
// ============================================================

/**
 * Export Trial Balance (Balanza de Comprobación)
 */
export async function exportTrialBalanceExcel(
  data: any[],
  company: string,
  period: string = '',
  totals: { totalDebit: number; totalCredit: number; totalBalance: number } = { totalDebit: 0, totalCredit: 0, totalBalance: 0 }
): Promise<void> {
  const headers = ['Código', 'Cuenta', 'Tipo', 'Debe', 'Haber', 'Saldo'];
  const rows = data.map(row => {
    const indent = '  '.repeat(row.level ? row.level - 1 : 0);
    return [
      row.accountCode,
      `${indent}${row.accountName}`,
      row.accountType,
      row.totalDebit,
      row.totalCredit,
      row.balance,
    ];
  });

  // Add totals row
  rows.push(['', 'TOTALES', '', totals.totalDebit, totals.totalCredit, totals.totalBalance]);

  await exportToExcelTemplate({
    filename: `Balanza_Comprobacion_${period.replace('-', '_')}`,
    sheetName: 'Balanza',
    title: 'Balanza de Comprobación',
    company,
    period: `Período: ${period}`,
    headers,
    data: rows,
  });
}

/**
 * Export Trial Balance to PDF
 */
export async function exportTrialBalancePDF(
  data: any[],
  company: string,
  period: string = '',
  totals: { totalDebit: number; totalCredit: number; totalBalance: number } = { totalDebit: 0, totalCredit: 0, totalBalance: 0 }
): Promise<void> {
  const headers = ['Código', 'Cuenta', 'Tipo', 'Debe', 'Haber', 'Saldo'];
  const rows = data.map(row => {
    const indent = '  '.repeat(row.level ? row.level - 1 : 0);
    return [
      row.accountCode,
      { content: `${indent}${row.accountName}`, styles: { fontStyle: row.isGroup ? 'bold' : 'normal' } },
      row.accountType,
      `C$ ${row.totalDebit.toLocaleString()}`,
      `C$ ${row.totalCredit.toLocaleString()}`,
      `C$ ${row.balance.toLocaleString()}`,
    ];
  });

  rows.push(['', 'TOTALES', '', `C$ ${totals.totalDebit.toLocaleString()}`, `C$ ${totals.totalCredit.toLocaleString()}`, `C$ ${totals.totalBalance.toLocaleString()}`]);

  await exportToPDFTemplate({
    filename: `Balanza_Comprobacion_${period.replace('-', '_')}`,
    title: 'Balanza de Comprobación',
    company,
    period: `Período: ${period}`,
    headers,
    data: rows,
  });
}

/**
 * Export Balance Sheet (Balance General)
 */
export async function exportBalanceSheetExcel(
  assets: any[],
  liabilities: any[] = [],
  equity: any[] = [],
  company: string = '',
  period: string = ''
): Promise<void> {
  const headers = ['Concepto', 'Monto'];
  const rows: any[][] = [];

  const addItems = (title: string, items: any[]) => {
    rows.push([title.toUpperCase(), '']);
    (items || []).forEach(item => {
      // Indent by level
      const indent = '  '.repeat(item.level - 1);
      rows.push([`${indent}${item.accountName}`, item.balance]);
    });
    rows.push(['', '']);
  };

  addItems('ACTIVOS', assets);
  addItems('PASIVOS', liabilities);
  addItems('PATRIMONIO', equity);

  await exportToExcelTemplate({
    filename: `Balance_General_${period.replace('-', '_')}`,
    sheetName: 'Balance',
    title: 'Balance General',
    company,
    period: `Período: ${period}`,
    headers,
    data: rows,
  });
}

/**
 * Export Balance Sheet to PDF
 */
export async function exportBalanceSheetPDF(
  assets: any[],
  liabilities: any[] = [],
  equity: any[] = [],
  company: string = '',
  period: string = ''
): Promise<void> {
  const headers = ['Concepto', 'Monto'];
  const rows: any[][] = [];

  const addItems = (title: string, items: any[]) => {
    rows.push([{ content: title.toUpperCase(), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, '']);
    (items || []).forEach(item => {
      const indent = '  '.repeat(item.level - 1);
      rows.push([
        { content: `${indent}${item.accountName}`, styles: { fontStyle: item.isGroup ? 'bold' : 'normal' } }, 
        `C$ ${item.balance.toLocaleString()}`
      ]);
    });
  };

  addItems('ACTIVOS', assets);
  rows.push(['', '']);
  addItems('PASIVOS', liabilities);
  rows.push(['', '']);
  addItems('PATRIMONIO', equity);

  await exportToPDFTemplate({
    filename: `Balance_General_${period.replace('-', '_')}`,
    title: 'Balance General',
    company,
    period: `Período: ${period}`,
    headers,
    data: rows,
  });
}

/**
 * Export Income Statement (Estado de Resultados)
 */
export async function exportIncomeStatementExcel(
  income: any[],
  expenses: any[] = [],
  netIncome: number = 0,
  company: string = '',
  period: string = ''
): Promise<void> {
  const headers = ['Concepto', 'Monto'];
  const rows: any[][] = [];

  const addItems = (title: string, items: any[]) => {
    rows.push([title.toUpperCase(), '']);
    (items || []).forEach(item => {
      const indent = '  '.repeat(item.level - 1);
      rows.push([`${indent}${item.accountName}`, item.balance]);
    });
    rows.push(['', '']);
  };

  addItems('INGRESOS', income);
  addItems('GASTOS', expenses);
  
  rows.push(['UTILIDAD NETA', netIncome]);

  await exportToExcelTemplate({
    filename: `Estado_Resultados_${period.replace('-', '_')}`,
    sheetName: 'Resultados',
    title: 'Estado de Resultados',
    company,
    period: `Período: ${period}`,
    headers,
    data: rows,
  });
}

/**
 * Export Income Statement to PDF
 */
export async function exportIncomeStatementPDF(
  income: any[],
  expenses: any[] = [],
  netIncome: number = 0,
  company: string = '',
  period: string = ''
): Promise<void> {
  const headers = ['Concepto', 'Monto'];
  const rows: any[][] = [];

  const addItems = (title: string, items: any[], color: [number, number, number]) => {
    rows.push([{ content: title, styles: { fontStyle: 'bold', fillColor: color } }, '']);
    (items || []).forEach(item => {
      const indent = '  '.repeat(item.level - 1);
      rows.push([
        { content: `${indent}${item.accountName}`, styles: { fontStyle: item.isGroup ? 'bold' : 'normal' } }, 
        `C$ ${item.balance.toLocaleString()}`
      ]);
    });
  };

  addItems('INGRESOS', income, [209, 231, 221]);
  rows.push(['', '']);
  addItems('GASTOS', expenses, [248, 215, 218]);
  
  rows.push(['', '']);
  rows.push([{ content: 'UTILIDAD NETA', styles: { fontStyle: 'bold', fillColor: [107, 91, 149], textColor: [255, 255, 255] } }, `C$ ${netIncome.toLocaleString()}`]);

  await exportToPDFTemplate({
    filename: `Estado_Resultados_${period.replace('-', '_')}`,
    title: 'Estado de Resultados',
    company,
    period: `Período: ${period}`,
    headers,
    data: rows,
  });
}

/**
 * Export Journal Entries (Pólizas Contables)
 */
export async function exportJournalEntriesExcel(
  entries: any[],
  company: string,
  period?: string
): Promise<void> {
  const headers = ['Fecha', 'Tipo', 'Número', 'Descripción', 'Cuenta', 'Concepto', 'Debe', 'Haber'];
  const rows: any[][] = [];

  entries.forEach((entry) => {
    entry.lines?.forEach((line: any, idx: number) => {
      rows.push([
        idx === 0 ? entry.date : '',
        idx === 0 ? entry.entryType : '',
        idx === 0 ? entry.entryNumber : '',
        idx === 0 ? entry.description : '',
        line.accountCode,
        line.concept,
        line.debit,
        line.credit,
      ]);
    });
    rows.push(['', '', '', '', '', '', '', '']); // Separator
  });

  await exportToExcelTemplate({
    filename: `Polizas_Contables${period ? `_${period.replace('-', '_')}` : ''}`,
    sheetName: 'Pólizas',
    title: 'Pólizas Contables',
    company,
    period: period ? `Período: ${period}` : undefined,
    headers,
    data: rows,
  });
}

/**
 * Export Journal Entries to PDF
 */
export async function exportJournalEntriesPDF(
  entries: any[],
  company: string,
  period?: string
): Promise<void> {
  const headers = ['Fecha', 'Tipo', 'Número', 'Descripción', 'Cuenta', 'Debe', 'Haber'];
  const rows: any[][] = [];

  entries.forEach(entry => {
    entry.lines?.forEach((line: any, idx: number) => {
      rows.push([
        idx === 0 ? formatDate(entry.entryDate) : '',
        idx === 0 ? entry.entryType : '',
        idx === 0 ? entry.entryNumber : '',
        idx === 0 ? entry.description : '',
        line.accountCode,
        `C$ ${line.debit.toLocaleString()}`,
        `C$ ${line.credit.toLocaleString()}`
      ]);
    });
    rows.push([{ content: '', colSpan: 7, styles: { fillColor: [240, 240, 240] } }]);
  });

  await exportToPDFTemplate({
    filename: `Polizas_Contables${period ? `_${period.replace('-', '_')}` : ''}`,
    title: 'Pólizas Contables',
    company,
    period: period ? `Período: ${period}` : undefined,
    headers,
    data: rows,
    orientation: 'l' // Landscape for journals
  });
}



/**
 * Export Third Parties (Terceros)
 */
export async function exportThirdPartiesExcel(
  thirdParties: any[],
  company: string
): Promise<void> {
  const headers = ['Nombre', 'RUC', 'Tipo', 'Email', 'Teléfono', 'Saldo'];
  const rows = thirdParties.map(tp => [
    tp.name,
    tp.taxId,
    tp.thirdPartyType,
    tp.email,
    tp.phone,
    tp.balance,
  ]);

  await exportToExcelTemplate({
    filename: 'Reporte_Terceros',
    sheetName: 'Terceros',
    title: 'Catálogo de Terceros',
    company,
    headers,
    data: rows,
  });
}

/**
 * Export Third Parties to PDF
 */
export async function exportThirdPartiesPDF(
  thirdParties: any[],
  company: string
): Promise<void> {
  const headers = ['Nombre', 'RUC', 'Tipo', 'Email', 'Teléfono', 'Saldo'];
  const rows = thirdParties.map(tp => [
    tp.name,
    tp.taxId,
    tp.thirdPartyType,
    tp.email,
    tp.phone,
    `C$ ${tp.balance.toLocaleString()}`,
  ]);

  await exportToPDFTemplate({
    filename: 'Reporte_Terceros',
    title: 'Catálogo de Terceros',
    company,
    headers,
    data: rows,
    orientation: 'l'
  });
}

/**
 * Export Accounts Chart (Catálogo de Cuentas)
 */
export async function exportAccountsExcel(
  accounts: any[],
  company: string
): Promise<void> {
  const headers = ['Código', 'Nombre', 'Tipo', 'Naturaleza', 'Nivel', 'Padre'];
  const rows = accounts.map(acc => [
    acc.code,
    acc.name,
    acc.accountType,
    acc.nature,
    acc.level,
    acc.parentAccount?.name || '',
  ]);

  await exportToExcelTemplate({
    filename: 'Catalogo_Cuentas',
    sheetName: 'Cuentas',
    title: 'Catálogo de Cuentas',
    company,
    headers,
    data: rows,
  });
}

/**
 * Export Accounts Chart to PDF
 */
export async function exportAccountsPDF(
  accounts: any[],
  company: string
): Promise<void> {
  const headers = ['Código', 'Nombre', 'Tipo', 'Nivel', 'Padre'];
  const rows = accounts.map(acc => [
    acc.code,
    acc.name,
    acc.accountType,
    acc.level,
    acc.parentAccount?.name || '',
  ]);

  await exportToPDFTemplate({
    filename: 'Catalogo_Cuentas',
    title: 'Catálogo de Cuentas',
    company,
    headers,
    data: rows
  });
}

/**
 * Export Invoices to Excel
 */
export async function exportInvoicesExcel(
  invoices: any[],
  company: string
): Promise<void> {
  const headers = ['Número', 'Fecha', 'Tercero', 'Subtotal', 'IVA', 'Total', 'Estado'];
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    formatDate(inv.date),
    inv.thirdParty?.name || '',
    inv.subtotal,
    inv.taxAmount,
    inv.total,
    inv.status
  ]);

  await exportToExcelTemplate({
    filename: 'Reporte_Facturas',
    sheetName: 'Facturas',
    title: 'Reporte de Facturación',
    company,
    headers,
    data: rows
  });
}

/**
 * Export Invoices to PDF
 */
export async function exportInvoicesPDF(
  invoices: any[],
  company: string
): Promise<void> {
  const headers = ['Número', 'Fecha', 'Tercero', 'Total', 'Estado'];
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    formatDate(inv.date),
    inv.thirdParty?.name || '',
    `C$ ${inv.total.toLocaleString()}`,
    inv.status
  ]);

  await exportToPDFTemplate({
    filename: 'Reporte_Facturas',
    title: 'Reporte de Facturación',
    company,
    headers,
    data: rows,
    orientation: 'l'
  });
}

/**
 * Export Bank Movements to Excel
 */
export async function exportBanksExcel(
  movements: any[],
  company: string,
  accountName: string
): Promise<void> {
  const headers = ['Fecha', 'Referencia', 'Descripción', 'Tipo', 'Monto'];
  const rows = movements.map(m => [
    formatDate(m.date),
    m.reference,
    m.description,
    m.type,
    m.amount
  ]);

  await exportToExcelTemplate({
    filename: `Movimientos_Banco_${accountName.replace(/\s+/g, '_')}`,
    sheetName: 'Movimientos',
    title: `Estado de Cuenta: ${accountName}`,
    company,
    headers,
    data: rows
  });
}

/**
 * Export Bank Movements to PDF
 */
export async function exportBanksPDF(
  movements: any[],
  company: string,
  accountName: string
): Promise<void> {
  const headers = ['Fecha', 'Ref', 'Descripción', 'Monto'];
  const rows = movements.map(m => [
    formatDate(m.date),
    m.reference,
    m.description,
    `${m.type === 'DEBIT' ? '-' : '+'} C$ ${m.amount.toLocaleString()}`
  ]);

  await exportToPDFTemplate({
    filename: `Movimientos_Banco_${accountName.replace(/\s+/g, '_')}`,
    title: `Estado de Cuenta: ${accountName}`,
    company,
    headers,
    data: rows
  });
}

/**
 * Export Audit Logs to Excel
 */
export async function exportAuditExcel(
  logs: any[],
  company: string
): Promise<void> {
  const headers = ['Fecha/Hora', 'Usuario', 'Acción', 'Entidad', 'Detalles'];
  const rows = logs.map(log => [
    formatDate(log.timestamp, 'dd/MM/yy HH:mm'),
    log.user?.name || 'Sistema',
    log.action,
    log.entityId || '-',
    log.details
  ]);

  await exportToExcelTemplate({
    filename: 'Bitacora_Auditoria',
    sheetName: 'Bitácora',
    title: 'Bitácora de Auditoría',
    company,
    headers,
    data: rows
  });
}

/**
 * Export Audit Logs to PDF
 */
export async function exportAuditPDF(
  logs: any[],
  company: string
): Promise<void> {
  const headers = [['Fecha/Hora', 'Usuario', 'Acción', 'Entidad', 'Detalles']];
  const rows = logs.map(l => [
    formatDate(l.timestamp, 'dd/MM/yy HH:mm'),
    l.user?.name || 'Sistema',
    l.action,
    l.entityId || '-',
    l.details
  ]);

  await exportToPDFTemplate({
    filename: 'Bitacora_Auditoria',
    title: 'BITÁCORA DE AUDITORÍA',
    company,
    headers: headers[0],
    data: rows,
    orientation: 'l'
  });
}
