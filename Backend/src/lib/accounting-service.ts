import { db } from './db';
import { Prisma } from '@prisma/client';

/**
 * Service to handle automatic accounting generation for Invoices
 */
export async function generateInvoiceJournalEntry(tx: Prisma.TransactionClient, invoiceId: string, userId: string) {
  // 1. Fetch full invoice with lines and tax entries
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      taxEntries: true,
      thirdParty: true,
      company: true,
    },
  });

  if (!invoice) throw new Error('Invoice not found');

  // Helper for strict rounding
  const round = (val: number) => Math.round(val * 100) / 100;

  // 2. Determine main accounts based on dynamic mapping from company metadata
  const metadata = (invoice.company.metadata as any) || {};
  const mapping = metadata.accountMapping || {
    clientes: '1.1.02.01',
    proveedores: '2.1.01.01',
    ivaPagar: '2.1.02.01',
    ivaAcreditable: '1.1.03.01',
    retIrRecibida: '1.1.03.02',
    retIrPagar: '2.1.02.02'
  };

  const accounts = await tx.account.findMany({
    where: {
      companyId: invoice.companyId,
      code: { in: Object.values(mapping) as string[] }
    }
  });

  const getAccountByCode = (code: string) => accounts.find(a => a.code === code);

  const accClientes = getAccountByCode(mapping.clientes);
  const accProveedores = getAccountByCode(mapping.proveedores);
  const accIvaPagar = getAccountByCode(mapping.ivaPagar);
  const accIvaAcreditable = getAccountByCode(mapping.ivaAcreditable);
  const accRetIRRecibida = getAccountByCode(mapping.retIrRecibida);
  const accRetIRPagar = getAccountByCode(mapping.retIrPagar);

  const isSale = invoice.invoiceType === 'SALE';
  const totalAmount = round(Number(invoice.totalAmount));
  const subtotal = round(Number(invoice.subtotal));
  const taxAmount = round(Number(invoice.taxAmount));

  // 3. Prepare Journal Entry Lines
  const jeLines: any[] = [];
  let currentTotalDebit = 0;
  let currentTotalCredit = 0;

  if (isSale) {
    let totalRetentions = 0;
    for (const tax of invoice.taxEntries) {
      const amount = round(Number(tax.taxAmount));
      if (tax.taxType !== 'IVA') { 
        totalRetentions = round(totalRetentions + amount);
        jeLines.push({
          accountId: accRetIRRecibida?.id || accClientes?.id,
          description: `Retención ${tax.taxType} Recibida - Factura ${invoice.number}`,
          debit: amount,
          credit: 0,
        });
        currentTotalDebit = round(currentTotalDebit + amount);
      }
    }

    const netReceivable = round(totalAmount - totalRetentions);
    if (accClientes) {
      jeLines.push({
        accountId: accClientes.id,
        description: `CxC Factura ${invoice.number} - ${invoice.thirdParty.name}`,
        debit: netReceivable,
        credit: 0,
      });
      currentTotalDebit = round(currentTotalDebit + netReceivable);
    }

    // Lines (Income)
    for (const line of invoice.lines) {
      if (line.accountId) {
        const amount = round(Number(line.subtotal));
        jeLines.push({
          accountId: line.accountId,
          costCenterId: line.costCenterId,
          description: line.description,
          debit: 0,
          credit: amount,
        });
        currentTotalCredit = round(currentTotalCredit + amount);
      }
    }

    // Taxes (IVA)
    if (taxAmount > 0 && accIvaPagar) {
      jeLines.push({
        accountId: accIvaPagar.id,
        description: `IVA por Pagar Factura ${invoice.number}`,
        debit: 0,
        credit: taxAmount,
      });
      currentTotalCredit = round(currentTotalCredit + taxAmount);
    }
  } else {
    let totalRetentions = 0;
    for (const tax of invoice.taxEntries) {
      const amount = round(Number(tax.taxAmount));
      if (tax.taxType !== 'IVA') {
        totalRetentions = round(totalRetentions + amount);
        jeLines.push({
          accountId: accRetIRPagar?.id || accProveedores?.id,
          description: `Retención ${tax.taxType} Efectuada - Factura ${invoice.number}`,
          debit: 0,
          credit: amount,
        });
        currentTotalCredit = round(currentTotalCredit + amount);
      }
    }

    const netPayable = round(totalAmount - totalRetentions);
    if (accProveedores) {
      jeLines.push({
        accountId: accProveedores.id,
        description: `CxP Factura ${invoice.number} - ${invoice.thirdParty.name}`,
        debit: 0,
        credit: netPayable,
      });
      currentTotalCredit = round(currentTotalCredit + netPayable);
    }

    // Lines (Expense/Inventory)
    for (const line of invoice.lines) {
      if (line.accountId) {
        const amount = round(Number(line.subtotal));
        jeLines.push({
          accountId: line.accountId,
          costCenterId: line.costCenterId,
          description: line.description,
          debit: amount,
          credit: 0,
        });
        currentTotalDebit = round(currentTotalDebit + amount);
      }
    }

    // Taxes (IVA)
    if (taxAmount > 0 && accIvaAcreditable) {
      jeLines.push({
        accountId: accIvaAcreditable.id,
        description: `IVA Acreditable Factura ${invoice.number}`,
        debit: taxAmount,
        credit: 0,
      });
      currentTotalDebit = round(currentTotalDebit + taxAmount);
    }
  }

  // Final Balance Adjustment (Asegurar Partida Doble perfecta por centavos)
  const diff = round(currentTotalDebit - currentTotalCredit);
  if (diff !== 0 && jeLines.length > 0) {
    // Ajustar el último movimiento de CxC/CxP por el diferencial de centavos
    const mainLine = jeLines.find(l => l.accountId === (isSale ? accClientes?.id : accProveedores?.id));
    if (mainLine) {
      if (isSale) {
        mainLine.debit = round(mainLine.debit - diff);
        currentTotalDebit = round(currentTotalDebit - diff);
      } else {
        mainLine.credit = round(mainLine.credit + diff);
        currentTotalCredit = round(currentTotalCredit + diff);
      }
    }
  }

  // 4. Find active period
  const date = new Date(invoice.issueDate);
  const period = await tx.accountingPeriod.findFirst({
    where: {
      companyId: invoice.companyId,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      status: 'OPEN',
    }
  });

  if (!period) return null;

  // 5. Create Journal Entry
  const entryNumber = `AS-${invoice.invoiceType === 'SALE' ? 'VTA' : 'COM'}-${invoice.number}`;
  
  const journalEntry = await tx.journalEntry.create({
    data: {
      companyId: invoice.companyId,
      periodId: period.id,
      entryNumber,
      description: `Generación automática por factura ${invoice.number} - ${invoice.thirdParty.name}`,
      entryDate: date,
      entryType: isSale ? 'INGRESO' : 'EGRESO',
      status: 'DRAFT',
      totalDebit: currentTotalDebit,
      totalCredit: currentTotalCredit,
      lines: {
        create: jeLines,
      },
    },
  });

  // 6. Link back to invoice
  await tx.invoice.update({
    where: { id: invoiceId },
    data: { journalEntryId: journalEntry.id },
  });

  return journalEntry;
}
