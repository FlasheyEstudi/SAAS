import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/tax/reports/iva-summary - Resumen de IVA
// Calcula: IVA cobrado (ventas), IVA pagado (compras),
// IVA a cargo, IVA a favor, IVA neto a pagar
// Parámetros: companyId (requerido), dateFrom, dateTo, month, year
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Parsear período: priority to explicit dateFrom/dateTo, fallback to month/year
    const dateFromStr = searchParams.get('dateFrom') || '';
    const dateToStr = searchParams.get('dateTo') || '';
    const monthStr = searchParams.get('month') || '';
    const yearStr = searchParams.get('year') || '';

    let dateFrom: Date;
    let dateTo: Date;

    if (dateFromStr && dateToStr) {
      dateFrom = new Date(dateFromStr);
      dateTo = new Date(dateToStr + 'T23:59:59.999Z');
    } else if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return error('Los parámetros year y month deben ser números válidos (month: 1-12)');
      }
      // Primer y último día del mes
      dateFrom = new Date(year, month - 1, 1);
      dateTo = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      return error('Debe proporcionar dateFrom y dateTo, o month y year');
    }

    // Obtener todas las entradas de IVA del período
    const taxEntries = await db.taxEntry.findMany({
      where: {
        companyId,
        taxType: { in: ['IVA', 'RET_IVA'] },
        invoice: {
          issueDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            invoiceType: true,
            issueDate: true,
            totalAmount: true,
            thirdParty: {
              select: { id: true, name: true, taxId: true },
            },
          },
        },
        taxRate: {
          select: { id: true, name: true, rate: true },
        },
      },
    });

    // Separar por tipo de operación
    const ivaCobradoEntries = taxEntries.filter(
      e => e.invoice.invoiceType === 'SALE' && e.taxType === 'IVA' && !e.isRetention
    );
    const ivaPagadoEntries = taxEntries.filter(
      e => e.invoice.invoiceType === 'PURCHASE' && e.taxType === 'IVA' && !e.isRetention
    );
    const retIvaCobradoEntries = taxEntries.filter(
      e => e.invoice.invoiceType === 'SALE' && e.taxType === 'RET_IVA'
    );
    const retIvaPagadoEntries = taxEntries.filter(
      e => e.invoice.invoiceType === 'PURCHASE' && e.taxType === 'RET_IVA'
    );

    // Calcular totales
    const ivaCobrado = ivaCobradoEntries.reduce((sum, e) => sum + e.taxAmount, 0);
    const ivaPagado = ivaPagadoEntries.reduce((sum, e) => sum + e.taxAmount, 0);
    const retIvaCobrado = retIvaCobradoEntries.reduce((sum, e) => sum + e.withholdingAmount, 0);
    const retIvaPagado = retIvaPagadoEntries.reduce((sum, e) => sum + e.withholdingAmount, 0);

    // Base gravable total
    const baseGravableVentas = ivaCobradoEntries.reduce((sum, e) => sum + e.taxableBase, 0);
    const baseGravableCompras = ivaPagadoEntries.reduce((sum, e) => sum + e.taxableBase, 0);

    // Cálculo del IVA neto
    // IVA a cargo = IVA cobrado por ventas
    // IVA a favor = IVA pagado por compras
    // IVA neto = IVA a cargo - IVA a favor (positivo = a pagar, negativo = a favor)
    const ivaACargo = ivaCobrado;
    const ivaAFavor = ivaPagado;
    const ivaNeto = Math.round((ivaACargo - ivaAFavor) * 100) / 100;

    // Retenciones de IVA
    const retIvaPorCobrar = retIvaPagado; // Retenciones que nos hicieron (compras) = crédito
    const retIvaPorPagar = retIvaCobrado; // Retenciones que hicimos (ventas) = débito

    const result = {
      periodo: {
        fechaDesde: dateFrom.toISOString(),
        fechaHasta: dateTo.toISOString(),
      },
      resumen: {
        ivaCobrado: Math.round(ivaCobrado * 100) / 100,
        ivaPagado: Math.round(ivaPagado * 100) / 100,
        baseGravableVentas: Math.round(baseGravableVentas * 100) / 100,
        baseGravableCompras: Math.round(baseGravableCompras * 100) / 100,
        ivaACargo: Math.round(ivaACargo * 100) / 100,
        ivaAFavor: Math.round(ivaAFavor * 100) / 100,
        ivaNeto,
        ivaNetoEstatus: ivaNeto >= 0 ? 'A CARGO (POR PAGAR)' : 'A FAVOR (ACREEDOR)',
        retIvaPorCobrar: Math.round(retIvaPorCobrar * 100) / 100,
        retIvaPorPagar: Math.round(retIvaPorPagar * 100) / 100,
      },
      detalle: {
        ventas: ivaCobradoEntries.map(e => ({
          invoiceId: e.invoice.id,
          factura: e.invoice.number,
          fecha: e.invoice.issueDate,
          tercero: e.invoice.thirdParty?.name || 'N/A',
          rfc: e.invoice.thirdParty?.taxId || 'N/A',
          baseGravable: Math.round(e.taxableBase * 100) / 100,
          tasa: e.taxRate.rate,
          iva: Math.round(e.taxAmount * 100) / 100,
        })),
        compras: ivaPagadoEntries.map(e => ({
          invoiceId: e.invoice.id,
          factura: e.invoice.number,
          fecha: e.invoice.issueDate,
          tercero: e.invoice.thirdParty?.name || 'N/A',
          rfc: e.invoice.thirdParty?.taxId || 'N/A',
          baseGravable: Math.round(e.taxableBase * 100) / 100,
          tasa: e.taxRate.rate,
          iva: Math.round(e.taxAmount * 100) / 100,
        })),
      },
      estadisticas: {
        totalFacturasVentas: new Set(ivaCobradoEntries.map(e => e.invoice.id)).size,
        totalFacturasCompras: new Set(ivaPagadoEntries.map(e => e.invoice.id)).size,
        totalEntradasIva: taxEntries.length,
      },
    };

    return success(result);
  } catch (err) {
    console.error('Error al generar resumen de IVA:', err);
    return serverError('Error al generar el resumen de IVA');
  }
}
