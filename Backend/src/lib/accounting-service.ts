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

  // If already has a journal entry, we might want to update it or skip
  // For simplicity in this "definitive" version, we delete the old one if it exists to regenerate
  if (invoice.journalEntryId) {
    // This is optional, but helps keep data clean
    // await tx.journalEntry.delete({ where: { id: invoice.journalEntryId } });
  }

  // 2. Determine main accounts based on codes from our definitive seed
  // Note: In a production app, these should be configurable in Company Settings
  const accounts = await tx.account.findMany({
    where: {
      companyId: invoice.companyId,
      code: { in: ['1.1.02.01', '2.1.01.01', '2.1.02.01', '1.1.03.01', '1.1.03.02', '2.1.02.02'] }
    }
  });

  const getAccountByCode = (code: string) => accounts.find(a => a.code === code);

  const accClientes = getAccountByCode('1.1.02.01');
  const accProveedores = getAccountByCode('2.1.01.01');
  const accIvaPagar = getAccountByCode('2.1.02.01');
  const accIvaAcreditable = getAccountByCode('1.1.03.01');
  const accRetIRRecibida = getAccountByCode('1.1.03.02');
  const accRetIRPagar = getAccountByCode('2.1.02.02');

  const isSale = invoice.invoiceType === 'SALE';
  const totalAmount = Number(invoice.totalAmount);
  const subtotal = Number(invoice.subtotal);
  const taxAmount = Number(invoice.taxAmount);

  // 3. Prepare Journal Entry Lines
  const jeLines: any[] = [];
  let currentTotalDebit = 0;
  let currentTotalCredit = 0;

  if (isSale) {
    // VENTAS:
    // DEBIT: Clientes (Total - Retenciones si se aplican en factura, o Total completo si se aplican en pago)
    // DEBIT: Anticipo de IR / Retenciones Recibidas (Si hay retenciones en factura)
    // CREDIT: Ingresos (Subtotal de cada línea)
    // CREDIT: IVA por Pagar
    
    let totalRetentions = 0;
    for (const tax of invoice.taxEntries) {
      const amount = Number(tax.taxAmount);
      // If it's a retention in a SALE, it's an ASSET for us (someone retained from us)
      if (tax.taxType !== 'IVA') { 
        totalRetentions += amount;
        jeLines.push({
          accountId: accRetIRRecibida?.id || accClientes?.id, // Fallback to Clientes if no specific account
          description: `Retención ${tax.taxType} Recibida - Factura ${invoice.number}`,
          debit: amount,
          credit: 0,
        });
        currentTotalDebit += amount;
      }
    }

    const netReceivable = totalAmount - totalRetentions;
    if (accClientes) {
      jeLines.push({
        accountId: accClientes.id,
        description: `CxC Factura ${invoice.number} - ${invoice.thirdParty.name}`,
        debit: netReceivable,
        credit: 0,
      });
      currentTotalDebit += netReceivable;
    }

    // Lines (Income)
    for (const line of invoice.lines) {
      if (line.accountId) {
        const amount = Number(line.subtotal);
        jeLines.push({
          accountId: line.accountId,
          costCenterId: line.costCenterId,
          description: line.description,
          debit: 0,
          credit: amount,
        });
        currentTotalCredit += amount;
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
      currentTotalCredit += taxAmount;
    }
  } else {
    // COMPRAS:
    // DEBIT: Gasto/Inventario (Subtotal de cada línea)
    // DEBIT: IVA Acreditable
    // CREDIT: Proveedores (Neto a pagar)
    // CREDIT: Retenciones por Pagar (Lo que retuvimos al proveedor)

    let totalRetentions = 0;
    for (const tax of invoice.taxEntries) {
      const amount = Number(tax.taxAmount);
      if (tax.taxType !== 'IVA') {
        totalRetentions += amount;
        jeLines.push({
          accountId: accRetIRPagar?.id || accProveedores?.id,
          description: `Retención ${tax.taxType} Efectuada - Factura ${invoice.number}`,
          debit: 0,
          credit: amount,
        });
        currentTotalCredit += amount;
      }
    }

    const netPayable = totalAmount - totalRetentions;
    if (accProveedores) {
      jeLines.push({
        accountId: accProveedores.id,
        description: `CxP Factura ${invoice.number} - ${invoice.thirdParty.name}`,
        debit: 0,
        credit: netPayable,
      });
      currentTotalCredit += netPayable;
    }

    // Lines (Expense/Inventory)
    for (const line of invoice.lines) {
      if (line.accountId) {
        const amount = Number(line.subtotal);
        jeLines.push({
          accountId: line.accountId,
          costCenterId: line.costCenterId,
          description: line.description,
          debit: amount,
          credit: 0,
        });
        currentTotalDebit += amount;
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
      currentTotalDebit += taxAmount;
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

  if (!period) {
    console.warn(`No se encontró periodo abierto para ${date.getFullYear()}-${date.getMonth()+1}`);
    return null;
  }

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
