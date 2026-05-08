import { db } from '@/lib/db';
import { success, error, serverError, validateAuth, ensurePeriodOpen } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// POST /api/invoices/[id]/pay - Register a payment against an invoice
// Body: { amount: number, journalEntryId?: string, description?: string }
// ============================================================
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { amount, journalEntryId, description } = body;

    // Get current invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return error('Factura no encontrada', 404);
    }

    // Default amount to balanceDue if not provided
    const paymentAmount = (amount === undefined || amount === null) ? Number(invoice.balanceDue) : Number(amount);

    // Validate amount
    if (paymentAmount <= 0) {
      return error('El monto del pago debe ser mayor a 0');
    }

    // Cannot pay a cancelled invoice
    if (invoice.status === 'CANCELLED') {
      return error('No se puede registrar un pago en una factura cancelada');
    }

    // Cannot pay a fully paid invoice
    if (invoice.status === 'PAID' || Number(invoice.balanceDue) <= 0) {
      return error('La factura ya está completamente pagada');
    }

    // Validate amount does not exceed balance due
    if (paymentAmount > Number(invoice.balanceDue)) {
      return error(
        `El monto del pago (${paymentAmount}) excede el saldo pendiente (${Number(invoice.balanceDue)})`
      );
    }

    // Verify journal entry exists if provided
    if (journalEntryId) {
      const je = await db.journalEntry.findUnique({ where: { id: journalEntryId } });
      if (!je) {
        return error('La póliza contable especificada no existe');
      }
    }

    // Calculate new balance
    const newBalanceDue = Math.round((Number(invoice.balanceDue) - paymentAmount) * 100) / 100;

    // Determine new status
    let newStatus: any;
    if (newBalanceDue <= 0) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIAL';
    }

    // VALIDACIÓN DE PERIODO ABIERTO (Audit M2/Security)
    const isOpen = await ensurePeriodOpen(invoice.companyId, new Date());
    if (!isOpen) {
      return error('No se pueden registrar pagos en un periodo contable cerrado o bloqueado');
    }

    // 1. Get bank account if provided, or first one
    const { bankAccountId } = body;
    const bankAccount = bankAccountId 
      ? await db.bankAccount.findUnique({ where: { id: bankAccountId } })
      : await db.bankAccount.findFirst({ where: { companyId: invoice.companyId } });

    if (!bankAccount) return error('No se encontró una cuenta de banco para registrar el movimiento');

    // 2. Ejecutar transacción atómica (SEGURIDAD TOTAL)
    const result = await db.$transaction(async (tx) => {
      // 2.1 Crear Movimiento Bancario
      const isSale = invoice.invoiceType === 'SALE';
      const movement = await tx.bankMovement.create({
        data: {
          bankAccountId: bankAccount.id,
          movementDate: new Date(),
          description: `Pago Factura ${invoice.number} - ${description || 'Liquidación'}`,
          amount: paymentAmount,
          movementType: isSale ? 'DEBIT' : 'CREDIT', // DEBIT = Ingresa dinero (Venta), CREDIT = Sale dinero (Compra)
          status: 'RECONCILED'
        }
      });

      // 2.2 Actualizar saldo del banco
      await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: { 
          currentBalance: { 
            [isSale ? 'increment' : 'decrement']: paymentAmount 
          }
        }
      });

      // 2.3 Crear Asiento Contable (Póliza de Pago)
      // 2.3.1 Obtener mapeo dinámico (Audit M4)
      const company = await tx.company.findUnique({ where: { id: invoice.companyId } });
      const metadata = (company?.metadata as any) || {};
      const mapping = metadata.accountMapping || {
        clientes: '1.1.02.01',
        proveedores: '2.1.01.01',
        cajaBancos: bankAccount.currency === 'USD' ? '1.1.01.02' : '1.1.01.01'
      };

      const isSale = invoice.invoiceType === 'SALE';
      const partyAccountCode = isSale ? mapping.clientes : mapping.proveedores;
      const bankAccountCode = mapping.cajaBancos;

      const accounts = await tx.account.findMany({
        where: { 
          companyId: invoice.companyId, 
          code: { in: [partyAccountCode, bankAccountCode] } 
        }
      });

      const accParty = accounts.find(a => a.code === partyAccountCode);
      const accBank = accounts.find(a => a.code === bankAccountCode);

      if (!accParty || !accBank) {
        throw new Error(`Configuración contable incompleta. Faltan cuentas: ${!accParty ? partyAccountCode : ''} ${!accBank ? bankAccountCode : ''}`);
      }

      let journalEntryIdResult = journalEntryId;

      const period = await tx.accountingPeriod.findFirst({
        where: { 
          companyId: invoice.companyId, 
          status: 'OPEN', 
          year: new Date().getFullYear(), 
          month: new Date().getMonth() + 1 
        }
      });

      if (period) {
        const je = await tx.journalEntry.create({
          data: {
            companyId: invoice.companyId,
            periodId: period.id,
            entryNumber: `PAG-${invoice.number}-${Date.now().toString().slice(-4)}`,
            description: `Pago a factura ${invoice.number} - ${description || ''}`,
            entryDate: new Date(),
            entryType: isSale ? 'INGRESO' : 'EGRESO',
            status: 'POSTED',
            totalDebit: paymentAmount,
            totalCredit: paymentAmount,
            lines: {
              create: [
                { 
                  accountId: isSale ? accBank.id : accParty.id, 
                  debit: paymentAmount, credit: 0, 
                  description: `Liquidación Factura ${invoice.number}` 
                },
                { 
                  accountId: isSale ? accParty.id : accBank.id, 
                  debit: 0, credit: paymentAmount, 
                  description: `Liquidación Factura ${invoice.number}` 
                }
              ]
            }
          }
        });
        journalEntryIdResult = je.id;
      }

      // 2.4 Actualizar factura
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          balanceDue: Math.max(0, newBalanceDue),
          status: newStatus,
          journalEntryId: journalEntryIdResult,
        },
        include: {
          thirdParty: { select: { id: true, name: true, type: true } },
        },
      });

      return { updatedInvoice, movement };
    });

    return success({
      ...result.updatedInvoice,
      paymentInfo: {
        amount: paymentAmount,
        bankMovementId: result.movement.id,
        previousBalanceDue: invoice.balanceDue,
        newBalanceDue: Math.max(0, newBalanceDue),
        statusChanged: invoice.status !== newStatus,
        newStatus,
      },
    });
  } catch (err) {
    console.error('Error processing invoice payment:', err);
    return serverError('Error al procesar el pago de la factura');
  }
}
