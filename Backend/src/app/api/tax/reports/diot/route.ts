import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/tax/reports/diot - Reporte DIOT
// Declaración Informativa de Operaciones con Terceros
// Cumplimiento DGI para compras con IVA desglosado
// Muestra: proveedor, RUC, monto, IVA, número de factura, fecha
// Parámetros: companyId (requerido), dateFrom, dateTo, month, year
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Parsear período
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
      dateFrom = new Date(year, month - 1, 1);
      dateTo = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      return error('Debe proporcionar dateFrom y dateTo, o month y year');
    }

    // Obtener facturas de compra (PURCHASE) del período
    const purchaseInvoices = await db.invoice.findMany({
      where: {
        companyId,
        invoiceType: 'PURCHASE',
        status: { not: 'CANCELLED' },
        issueDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        thirdParty: {
          select: { id: true, name: true, taxId: true },
        },
        taxEntries: {
          include: {
            taxRate: {
              select: { id: true, name: true, rate: true, taxType: true },
            },
          },
        },
      },
      orderBy: { issueDate: 'asc' },
    });

    // Construir el reporte DIOT
    // Agrupar por proveedor (RFC)
    const proveedoresMap = new Map<string, {
      ruc: string;
      nombre: string;
      operaciones: Array<{
        factura: string;
        fecha: string;
        montoTotal: number;
        baseGravable16: number;
        iva16: number;
        baseGravable8: number;
        iva8: number;
        baseGravable0: number;
        iva0: number;
        baseExento: number;
        ieps: number;
        retencionIva: number;
        retencionIsr: number;
      }>;
      totales: {
        montoTotal: number;
        iva16: number;
        iva8: number;
        iva0: number;
        baseExento: number;
        ieps: number;
        retencionIva: number;
        retencionIsr: number;
        totalIva: number;
      };
    }>();

    for (const invoice of purchaseInvoices) {
      const rucIdent = invoice.thirdParty?.taxId || 'SIN_RUC';
      const nombre = invoice.thirdParty?.name || 'Sin identificar';

      if (!proveedoresMap.has(rucIdent)) {
        proveedoresMap.set(rucIdent, {
          ruc: rucIdent,
          nombre,
          operaciones: [],
          totales: {
            montoTotal: 0,
            iva16: 0,
            iva8: 0,
            iva0: 0,
            baseExento: 0,
            ieps: 0,
            retencionIva: 0,
            retencionIsr: 0,
            totalIva: 0,
          },
        });
      }

      const proveedor = proveedoresMap.get(ruc)!;

      // Separar impuestos por tasa
      let iva16 = 0;
      let iva8 = 0;
      let iva0 = 0;
      let baseExento = 0;
      let ieps = 0;
      let retencionIva = 0;
      let retencionIsr = 0;
      let baseGravable16 = 0;
      let baseGravable8 = 0;
      let baseGravable0 = 0;

      for (const te of invoice.taxEntries) {
        if (te.taxType === 'IVA') {
          const rate = te.taxRate.rate;
          if (rate >= 0.15 && rate <= 0.17) {
            iva16 += te.taxAmount;
            baseGravable16 += te.taxableBase;
          } else if (rate >= 0.07 && rate <= 0.09) {
            iva8 += te.taxAmount;
            baseGravable8 += te.taxableBase;
          } else {
            iva0 += te.taxAmount;
            baseGravable0 += te.taxableBase;
          }
        } else if (te.taxType === 'RET_IVA') {
          retencionIva += te.withholdingAmount;
        } else if (te.taxType === 'RET_ISR') {
          retencionIsr += te.withholdingAmount;
        } else if (te.taxType === 'IEPS') {
          ieps += te.taxAmount;
        }
      }

      const operacion = {
        factura: invoice.number,
        fecha: invoice.issueDate.toISOString().split('T')[0],
        montoTotal: Math.round(invoice.totalAmount * 100) / 100,
        baseGravable16: Math.round(baseGravable16 * 100) / 100,
        iva16: Math.round(iva16 * 100) / 100,
        baseGravable8: Math.round(baseGravable8 * 100) / 100,
        iva8: Math.round(iva8 * 100) / 100,
        baseGravable0: Math.round(baseGravable0 * 100) / 100,
        iva0: Math.round(iva0 * 100) / 100,
        baseExento: Math.round(baseExento * 100) / 100,
        ieps: Math.round(ieps * 100) / 100,
        retencionIva: Math.round(retencionIva * 100) / 100,
        retencionIsr: Math.round(retencionIsr * 100) / 100,
      };

      proveedor.operaciones.push(operacion);

      // Acumular totales
      proveedor.totales.montoTotal += invoice.totalAmount;
      proveedor.totales.iva16 += iva16;
      proveedor.totales.iva8 += iva8;
      proveedor.totales.iva0 += iva0;
      proveedor.totales.baseExento += baseExento;
      proveedor.totales.ieps += ieps;
      proveedor.totales.retencionIva += retencionIva;
      proveedor.totales.retencionIsr += retencionIsr;
    }

    // Redondear totales
    const proveedores = Array.from(proveedoresMap.values()).map(p => ({
      ...p,
      totales: {
        montoTotal: Math.round(p.totales.montoTotal * 100) / 100,
        iva16: Math.round(p.totales.iva16 * 100) / 100,
        iva8: Math.round(p.totales.iva8 * 100) / 100,
        iva0: Math.round(p.totales.iva0 * 100) / 100,
        baseExento: Math.round(p.totales.baseExento * 100) / 100,
        ieps: Math.round(p.totales.ieps * 100) / 100,
        retencionIva: Math.round(p.totales.retencionIva * 100) / 100,
        retencionIsr: Math.round(p.totales.retencionIsr * 100) / 100,
        totalIva: Math.round((p.totales.iva16 + p.totales.iva8 + p.totales.iva0) * 100) / 100,
      },
    }));

    // Totales generales del reporte
    const granTotal = proveedores.reduce(
      (acc, p) => ({
        montoTotal: acc.montoTotal + p.totales.montoTotal,
        iva16: acc.iva16 + p.totales.iva16,
        iva8: acc.iva8 + p.totales.iva8,
        iva0: acc.iva0 + p.totales.iva0,
        baseExento: acc.baseExento + p.totales.baseExento,
        ieps: acc.ieps + p.totales.ieps,
        retencionIva: acc.retencionIva + p.totales.retencionIva,
        retencionIsr: acc.retencionIsr + p.totales.retencionIsr,
        totalIva: acc.totalIva + p.totales.totalIva,
      }),
      { montoTotal: 0, iva16: 0, iva8: 0, iva0: 0, baseExento: 0, ieps: 0, retencionIva: 0, retencionIsr: 0, totalIva: 0 }
    );

    // Redondear gran total
    for (const key of Object.keys(granTotal)) {
      granTotal[key as keyof typeof granTotal] = Math.round(granTotal[key as keyof typeof granTotal] * 100) / 100;
    }

    const result = {
      reporte: 'DIOT - Declaración Informativa de Operaciones con Terceros',
      periodo: {
        fechaDesde: dateFrom.toISOString().split('T')[0],
        fechaHasta: dateTo.toISOString().split('T')[0],
      },
      resumen: {
        totalProveedores: proveedores.length,
        totalOperaciones: proveedores.reduce((acc, p) => acc + p.operaciones.length, 0),
        granTotal,
      },
      proveedores,
    };

    return success(result);
  } catch (err) {
    console.error('Error al generar reporte DIOT:', err);
    return serverError('Error al generar el reporte DIOT');
  }
}
