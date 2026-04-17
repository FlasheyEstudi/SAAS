/**
 * Export utilities for Excel and PDF with professional templates
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

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
    // Create workbook with theme colors
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GANESHA';
    workbook.created = generatedDate;
    workbook.lastModifiedBy = 'GANESHA System';

    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: 'FF6B5B95' } },
    });

    // Define styles
    const titleStyle: any = {
      font: { name: 'Georgia', size: 24, bold: true, color: { argb: 'FF4A3F7F' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        bottom: { style: 'double', color: { argb: 'FF6B5B95' } },
      },
    };

    const subtitleStyle: any = {
      font: { name: 'Arial', size: 12, italic: true, color: { argb: 'FF80739E' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    const headerStyle: any = {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B5B95' },
      },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FF4A3F7F' } },
        bottom: { style: 'thin', color: { argb: 'FF4A3F7F' } },
        left: { style: 'thin', color: { argb: 'FFE0D8F0' } },
        right: { style: 'thin', color: { argb: 'FFE0D8F0' } },
      },
    };

    const cellStyle: any = {
      font: { name: 'Arial', size: 10, color: { argb: 'FF333333' } },
      alignment: { horizontal: 'left', vertical: 'middle' },
      border: {
        bottom: { style: 'thin', color: { argb: 'FFE0D8F0' } },
        left: { style: 'thin', color: { argb: 'FFF5F5F5' } },
        right: { style: 'thin', color: { argb: 'FFF5F5F5' } },
      },
    };

    const numericStyle = {
      ...cellStyle,
      numFmt: '$#,##0.00',
      alignment: { horizontal: 'right', vertical: 'middle' },
    };

    // Merge cells for title
    worksheet.mergeCells(`A1:${String.fromCharCode(65 + headers.length - 1)}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title.toUpperCase();
    titleCell.style = titleStyle;

    // Subtitle row
    if (subtitle || company || period) {
      const subText = [company, period, subtitle].filter(Boolean).join(' | ');
      worksheet.mergeCells(`A2:${String.fromCharCode(65 + headers.length - 1)}2`);
      const subCell = worksheet.getCell('A2');
      subCell.value = subText;
      subCell.style = subtitleStyle;
    }

    // Empty row before headers
    worksheet.addRow([]);

    // Headers row
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Data rows
    data.forEach((rowData, index) => {
      const row = worksheet.addRow(rowData);
      row.height = 20;
      
      // Alternate row colors
      if ((index + 1) % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9FB' },
          };
        });
      }

      // Apply styles based on content type
      row.eachCell((cell, colNum) => {
        const value = cell.value;
        if (typeof value === 'number') {
          cell.style = numericStyle;
        } else {
          cell.style = cellStyle;
        }
      });
    });

    // Auto-fit columns
    if (worksheet.columns) {
      worksheet.columns.forEach((column) => {
        if (!column) return;
        column.width = 15;
        let maxLength = 0;
        if (column.eachCell) {
          column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ? String(cell.value) : '';
            maxLength = Math.max(maxLength, cellValue.length + 2);
          });
        }
        column.width = Math.min(Math.max(maxLength, 15), 50);
      });
    }

    // Add footer with generation date
    const lastRow = data.length + 4;
    worksheet.mergeCells(`A${lastRow}:${String.fromCharCode(65 + headers.length - 1)}${lastRow}`);
    const footerCell = worksheet.getCell(`A${lastRow}`);
    footerCell.value = `Generado el ${generatedDate.toLocaleDateString('es-NI', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} por GANESHA`;
    footerCell.style = {
      font: { name: 'Arial', size: 9, italic: true, color: { argb: 'FF999999' } },
      alignment: { horizontal: 'right', vertical: 'middle' },
    };

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Error al generar el archivo Excel');
  }
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
  period: string,
  totals: { totalDebit: number; totalCredit: number; totalBalance: number }
): Promise<void> {
  const headers = ['Código', 'Cuenta', 'Tipo', 'Debe', 'Haber', 'Saldo'];
  const rows = data.map(row => [
    row.accountCode,
    row.accountName,
    row.accountType,
    row.totalDebit,
    row.totalCredit,
    row.balance,
  ]);

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
 * Export Balance Sheet (Balance General)
 */
export async function exportBalanceSheetExcel(
  assets: any[],
  liabilities: any[],
  equity: any[],
  company: string,
  period: string
): Promise<void> {
  const headers = ['Concepto', 'Monto'];
  const rows: any[][] = [];

  // Assets section
  rows.push(['ACTIVOS', '']);
  assets.forEach((item) => {
    rows.push([item.name, item.amount]);
    if (item.subItems) {
      item.subItems.forEach((sub: any) => {
        rows.push([`  ${sub.name}`, sub.amount]);
      });
    }
  });

  rows.push(['', '']);
  
  // Liabilities section
  rows.push(['PASIVOS', '']);
  liabilities.forEach((item) => {
    rows.push([item.name, item.amount]);
    if (item.subItems) {
      item.subItems.forEach((sub: any) => {
        rows.push([`  ${sub.name}`, sub.amount]);
      });
    }
  });

  rows.push(['', '']);
  
  // Equity section
  rows.push(['PATRIMONIO', '']);
  equity.forEach((item) => {
    rows.push([item.name, item.amount]);
  });

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
 * Export Income Statement (Estado de Resultados)
 */
export async function exportIncomeStatementExcel(
  income: any[],
  expenses: any[],
  netIncome: number,
  company: string,
  period: string
): Promise<void> {
  const headers = ['Concepto', 'Monto'];
  const rows: any[][] = [];

  // Income section
  rows.push(['INGRESOS', '']);
  income.forEach((item) => {
    rows.push([item.name, item.amount]);
  });
  rows.push(['Total Ingresos', income.reduce((sum: number, i: any) => sum + i.amount, 0)]);

  rows.push(['', '']);

  // Expenses section
  rows.push(['GASTOS', '']);
  expenses.forEach((item) => {
    rows.push([item.name, item.amount]);
  });
  rows.push(['Total Gastos', expenses.reduce((sum: number, e: any) => sum + e.amount, 0)]);

  rows.push(['', '']);
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
