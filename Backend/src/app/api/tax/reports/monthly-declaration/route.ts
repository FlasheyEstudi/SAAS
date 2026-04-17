import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/tax/reports/monthly-declaration - Declaración mensual
// Resume todas las obligaciones fiscales de un período:
// - IVA trasladado (cobrado en ventas)
// - IVA acreditable (pagado en compras)
// - IVA retenido (efectuado y sufrido)
// - Retenciones de ISR (efectuadas y sufridas)
// - IEPS
// - Base gravable total
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
    let periodoLabel: string;

    if (dateFromStr && dateToStr) {
      dateFrom = new Date(dateFromStr);
      dateTo = new Date(dateToStr + 'T23:59:59.999Z');
      periodoLabel = `${dateFrom.toISOString().split('T')[0]} al ${dateTo.toISOString().split('T')[0]}`;
    } else if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return error('Los parámetros year y month deben ser números válidos (month: 1-12)');
      }
      dateFrom = new Date(year, month - 1, 1);
      dateTo = new Date(year, month, 0, 23, 59, 59, 999);
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
      ];
      periodoLabel = `${meses[month - 1]} ${year}`;
    } else {
      return error('Debe proporcionar dateFrom y dateTo, o month y year');
    }

    // Obtener datos de la empresa
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, taxId: true },
    });

    // Obtener TODAS las entradas de impuesto del período
    const allTaxEntries = await db.taxEntry.findMany({
      where: {
        companyId,
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
            subtotal: true,
            status: true,
            thirdParty: {
              select: { id: true, name: true, taxId: true },
            },
          },
        },
        taxRate: {
          select: { id: true, name: true, rate: true, taxType: true },
        },
      },
    });

    // Obtener estadísticas de facturas
    const [ventas, compras] = await Promise.all([
      db.invoice.aggregate({
        where: {
          companyId,
          invoiceType: 'SALE',
          status: { not: 'CANCELLED' },
          issueDate: { gte: dateFrom, lte: dateTo },
        },
        _count: true,
        _sum: { totalAmount: true, subtotal: true, taxAmount: true },
      }),
      db.invoice.aggregate({
        where: {
          companyId,
          invoiceType: 'PURCHASE',
          status: { not: 'CANCELLED' },
          issueDate: { gte: dateFrom, lte: dateTo },
        },
        _count: true,
        _sum: { totalAmount: true, subtotal: true, taxAmount: true },
      }),
    ]);

    // ─── IVA TRASLADADO (de ventas) ───
    const ivaTrasladado = allTaxEntries.filter(
      e => e.taxType === 'IVA' && !e.isRetention && e.invoice.invoiceType === 'SALE'
    );
    const totalIvaTrasladado = ivaTrasladado.reduce((s, e) => s + e.taxAmount, 0);
    const baseGravableVentas = ivaTrasladado.reduce((s, e) => s + e.taxableBase, 0);

    // ─── IVA ACREDITABLE (de compras) ───
    const ivaAcreditable = allTaxEntries.filter(
      e => e.taxType === 'IVA' && !e.isRetention && e.invoice.invoiceType === 'PURCHASE'
    );
    const totalIvaAcreditable = ivaAcreditable.reduce((s, e) => s + e.taxAmount, 0);
    const baseGravableCompras = ivaAcreditable.reduce((s, e) => s + e.taxableBase, 0);

    // ─── RETENCIONES DE IVA ───
    const retIvaEfectuada = allTaxEntries.filter(
      e => e.taxType === 'RET_IVA' && e.invoice.invoiceType === 'SALE'
    );
    const retIvaSufrida = allTaxEntries.filter(
      e => e.taxType === 'RET_IVA' && e.invoice.invoiceType === 'PURCHASE'
    );
    const totalRetIvaEfectuada = retIvaEfectuada.reduce((s, e) => s + e.withholdingAmount, 0);
    const totalRetIvaSufrida = retIvaSufrida.reduce((s, e) => s + e.withholdingAmount, 0);

    // ─── RETENCIONES DE ISR ───
    const retIsrEfectuada = allTaxEntries.filter(
      e => e.taxType === 'RET_ISR' && e.invoice.invoiceType === 'SALE'
    );
    const retIsrSufrida = allTaxEntries.filter(
      e => e.taxType === 'RET_ISR' && e.invoice.invoiceType === 'PURCHASE'
    );
    const totalRetIsrEfectuada = retIsrEfectuada.reduce((s, e) => s + e.withholdingAmount, 0);
    const totalRetIsrSufrida = retIsrSufrida.reduce((s, e) => s + e.withholdingAmount, 0);

    // ─── IEPS ───
    const iepsEntries = allTaxEntries.filter(e => e.taxType === 'IEPS');
    const totalIeps = iepsEntries.reduce((s, e) => s + e.taxAmount, 0);
    const totalIepsCompras = iepsEntries.filter(e => e.invoice.invoiceType === 'PURCHASE').reduce((s, e) => s + e.taxAmount, 0);
    const totalIepsVentas = iepsEntries.filter(e => e.invoice.invoiceType === 'SALE').reduce((s, e) => s + e.taxAmount, 0);

    // ─── IMPUESTO CEDULAR ───
    const cedularEntries = allTaxEntries.filter(e => e.taxType === 'CEDULAR');
    const totalCedular = cedularEntries.reduce((s, e) => s + e.taxAmount + e.withholdingAmount, 0);

    // ─── CÁLCULO DEL IVA A PAGAR / A FAVOR ───
    // IVA a cargo = IVA trasladado
    // IVA a favor = IVA acreditable
    // IVA neto = IVA a cargo - IVA a favor - Retenciones de IVA sufridas + Retenciones de IVA efectuadas
    const ivaACargo = totalIvaTrasladado;
    const ivaAFavor = totalIvaAcreditable;
    const ivaNeto = Math.round((ivaACargo - ivaAFavor - totalRetIvaSufrida + totalRetIvaEfectuada) * 100) / 100;

    // Helper para redondear
    const r = (n: number) => Math.round(n * 100) / 100;

    const result = {
      reporte: 'Declaración Fiscal Mensual',
      empresa: {
        nombre: company?.name || 'N/A',
        ruc: company?.taxId || 'N/A',
      },
      periodo: {
        fechaDesde: dateFrom.toISOString().split('T')[0],
        fechaHasta: dateTo.toISOString().split('T')[0],
        descripcion: periodoLabel,
      },

      // ─── RESUMEN DE OPERACIONES ───
      operaciones: {
        ventas: {
          totalFacturas: ventas._count,
          subtotal: r(ventas._sum.subtotal || 0),
          impuestos: r(ventas._sum.taxAmount || 0),
          total: r(ventas._sum.totalAmount || 0),
        },
        compras: {
          totalFacturas: compras._count,
          subtotal: r(compras._sum.subtotal || 0),
          impuestos: r(compras._sum.taxAmount || 0),
          total: r(compras._sum.totalAmount || 0),
        },
      },

      // ─── IVA ───
      iva: {
        trasladado: {
          descripcion: 'IVA cobrado en ventas (IVA trasladado)',
          baseGravable: r(baseGravableVentas),
          monto: r(totalIvaTrasladado),
          facturas: new Set(ivaTrasladado.map(e => e.invoice.id)).size,
        },
        acreditable: {
          descripcion: 'IVA pagado en compras (IVA acreditable)',
          baseGravable: r(baseGravableCompras),
          monto: r(totalIvaAcreditable),
          facturas: new Set(ivaAcreditable.map(e => e.invoice.id)).size,
        },
        retencionEfectuada: {
          descripcion: 'IVA retenido a clientes (obligación)',
          monto: r(totalRetIvaEfectuada),
          facturas: new Set(retIvaEfectuada.map(e => e.invoice.id)).size,
        },
        retencionSufrida: {
          descripcion: 'IVA retenido por proveedores (crédito)',
          monto: r(totalRetIvaSufrida),
          facturas: new Set(retIvaSufrida.map(e => e.invoice.id)).size,
        },
        // Resultado del IVA
        aCargo: r(ivaACargo),
        aFavor: r(ivaAFavor),
        neto: ivaNeto,
        estatus: ivaNeto >= 0 ? 'A CARGO (POR PAGAR A LA DGI)' : 'A FAVOR (SALDO A FAVOR)',
      },

      // ─── RETENCIONES DE ISR ───
      retencionIsr: {
        efectuada: {
          descripcion: 'ISR retenido a clientes (obligación de enterar)',
          monto: r(totalRetIsrEfectuada),
          facturas: new Set(retIsrEfectuada.map(e => e.invoice.id)).size,
        },
        sufrida: {
          descripcion: 'ISR retenido por proveedores (pago provisional a crédito)',
          monto: r(totalRetIsrSufrida),
          facturas: new Set(retIsrSufrida.map(e => e.invoice.id)).size,
        },
      },

      // ─── IEPS ───
      ieps: {
        totalVentas: r(totalIepsVentas),
        totalCompras: r(totalIepsCompras),
        total: r(totalIeps),
        facturas: new Set(iepsEntries.map(e => e.invoice.id)).size,
      },

      // ─── IMPUESTO CEDULAR ───
      cedular: {
        total: r(totalCedular),
        facturas: new Set(cedularEntries.map(e => e.invoice.id)).size,
      },

      // ─── OBLIGACIONES FISCALES DEL PERÍODO ───
      obligaciones: {
        // Lo que se debe pagar a la DGI
        porPagar: {
          iva: ivaNeto >= 0 ? r(ivaNeto) : 0,
          retencionIrEfectuada: r(totalRetIsrEfectuada),
          retencionIvaEfectuada: r(totalRetIvaEfectuada),
          total: r(
            (ivaNeto >= 0 ? ivaNeto : 0) + totalRetIsrEfectuada + totalRetIvaEfectuada
          ),
        },
        // Créditos fiscales (a favor)
        creditosFiscales: {
          ivaAFavor: ivaNeto < 0 ? r(Math.abs(ivaNeto)) : 0,
          retencionIsrSufrida: r(totalRetIsrSufrida),
          retencionIvaSufrida: r(totalRetIvaSufrida),
          total: r(
            (ivaNeto < 0 ? Math.abs(ivaNeto) : 0) + totalRetIsrSufrida + totalRetIvaSufrida
          ),
        },
      },

      // ─── ESTADÍSTICAS ───
      estadisticas: {
        totalEntradasImpuesto: allTaxEntries.length,
        totalFacturasProcesadas: new Set(allTaxEntries.map(e => e.invoice.id)).size,
        tiposImpuestoPresentes: [...new Set(allTaxEntries.map(e => e.taxType))],
      },
    };

    return success(result);
  } catch (err) {
    console.error('Error al generar declaración mensual:', err);
    return serverError('Error al generar la declaración fiscal mensual');
  }
}
