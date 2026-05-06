import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/tax/reports/withholding - Reporte de retenciones
// Retenciones de ISR, IVA y otras retenciones
// Parámetros: companyId (requerido), dateFrom, dateTo, month, year,
//             withholdingType (RET_ISR, RET_IVA, CEDULAR, ALL)
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

    // Filtrar por tipo de retención
    const withholdingType = searchParams.get('withholdingType') || 'ALL';
    const validTypes = ['RET_ISR', 'RET_IVA', 'CEDULAR', 'ALL'];
    if (!validTypes.includes(withholdingType)) {
      return error(`Tipo de retención inválido. Valores permitidos: ${validTypes.join(', ')}`);
    }

    // Obtener entradas de retención
    const taxEntries = await db.taxEntry.findMany({
      where: {
        companyId,
        isRetention: true,
        ...(withholdingType !== 'ALL' ? { taxType: withholdingType } : {}),
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
              select: { id: true, name: true, taxId: true, type: true },
            },
          },
        },
        taxRate: {
          select: { id: true, name: true, rate: true, taxType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Separar retenciones por tipo
    const retencionesIsr = taxEntries.filter(e => e.taxType === 'RET_ISR');
    const retencionesIva = taxEntries.filter(e => e.taxType === 'RET_IVA');
    const retencionesCedular = taxEntries.filter(e => e.taxType === 'CEDULAR');

    // Retenciones de ISR: de compras (nos retuvieron) y de ventas (retuvimos a clientes)
    const retIsrCompras = retencionesIsr.filter(e => e.invoice.invoiceType === 'PURCHASE');
    const retIsrVentas = retencionesIsr.filter(e => e.invoice.invoiceType === 'SALE');

    // Retenciones de IVA: de compras y ventas
    const retIvaCompras = retencionesIva.filter(e => e.invoice.invoiceType === 'PURCHASE');
    const retIvaVentas = retencionesIva.filter(e => e.invoice.invoiceType === 'SALE');

    // Calcular totales
    const totalRetIsr = retencionesIsr.reduce((sum, e) => sum + Number(e.withholdingAmount), 0);
    const totalRetIva = retencionesIva.reduce((sum, e) => sum + Number(e.withholdingAmount), 0);
    const totalCedular = retencionesCedular.reduce((sum, e) => sum + Number(e.withholdingAmount), 0);
    const totalRetenciones = totalRetIsr + totalRetIva + totalCedular;

    // Retenciones sufridas (de compras = nos retuvieron = crédito fiscal)
    const retencionesSufridas = taxEntries.filter(e => e.invoice.invoiceType === 'PURCHASE');
    const totalRetencionesSufridas = retencionesSufridas.reduce((sum, e) => sum + Number(e.withholdingAmount), 0);

    // Retenciones efectuadas (de ventas = retuvimos = obligación de enterar)
    const retencionesEfectuadas = taxEntries.filter(e => e.invoice.invoiceType === 'SALE');
    const totalRetencionesEfectuadas = retencionesEfectuadas.reduce((sum, e) => sum + Number(e.withholdingAmount), 0);

    const result = {
      reporte: 'Reporte de Retenciones',
      periodo: {
        fechaDesde: dateFrom.toISOString().split('T')[0],
        fechaHasta: dateTo.toISOString().split('T')[0],
      },
      resumen: {
        totalRetencionIsr: Math.round(totalRetIsr * 100) / 100,
        totalRetencionIva: Math.round(totalRetIva * 100) / 100,
        totalCedular: Math.round(totalCedular * 100) / 100,
        totalRetenciones: Math.round(totalRetenciones * 100) / 100,
        // Retenciones sufridas (de compras - crédito fiscal)
        retencionesSufridas: Math.round(totalRetencionesSufridas * 100) / 100,
        retIsrSufrida: Math.round(retIsrCompras.reduce((s, e) => s + Number(e.withholdingAmount), 0) * 100) / 100,
        retIvaSufrida: Math.round(retIvaCompras.reduce((s, e) => s + Number(e.withholdingAmount), 0) * 100) / 100,
        // Retenciones efectuadas (de ventas - obligación de enterar)
        retencionesEfectuadas: Math.round(totalRetencionesEfectuadas * 100) / 100,
        retIsrEfectuada: Math.round(retIsrVentas.reduce((s, e) => s + Number(e.withholdingAmount), 0) * 100) / 100,
        retIvaEfectuada: Math.round(retIvaVentas.reduce((s, e) => s + Number(e.withholdingAmount), 0) * 100) / 100,
      },
      detalle: {
        retencionesIsr: retencionesIsr.map(e => ({
          id: e.id,
          factura: e.invoice.number,
          tipoFactura: e.invoice.invoiceType,
          fecha: e.invoice.issueDate.toISOString().split('T')[0],
          tercero: e.invoice.thirdParty?.name || 'N/A',
          rfc: e.invoice.thirdParty?.taxId || 'N/A',
          baseGravable: Math.round(Number(e.taxableBase) * 100) / 100,
          tasa: Number(e.taxRate.rate),
          montoRetenido: Math.round(Number(e.withholdingAmount) * 100) / 100,
          operacion: e.invoice.invoiceType === 'PURCHASE' ? 'Sufrida' : 'Efectuada',
        })),
        retencionesIva: retencionesIva.map(e => ({
          id: e.id,
          factura: e.invoice.number,
          tipoFactura: e.invoice.invoiceType,
          fecha: e.invoice.issueDate.toISOString().split('T')[0],
          tercero: e.invoice.thirdParty?.name || 'N/A',
          rfc: e.invoice.thirdParty?.taxId || 'N/A',
          baseGravable: Math.round(Number(e.taxableBase) * 100) / 100,
          tasa: Number(e.taxRate.rate),
          montoRetenido: Math.round(Number(e.withholdingAmount) * 100) / 100,
          operacion: e.invoice.invoiceType === 'PURCHASE' ? 'Sufrida' : 'Efectuada',
        })),
        retencionesCedular: retencionesCedular.map(e => ({
          id: e.id,
          factura: e.invoice.number,
          tipoFactura: e.invoice.invoiceType,
          fecha: e.invoice.issueDate.toISOString().split('T')[0],
          tercero: e.invoice.thirdParty?.name || 'N/A',
          rfc: e.invoice.thirdParty?.taxId || 'N/A',
          baseGravable: Math.round(Number(e.taxableBase) * 100) / 100,
          tasa: Number(e.taxRate.rate),
          montoRetenido: Math.round(Number(e.withholdingAmount) * 100) / 100,
          operacion: e.invoice.invoiceType === 'PURCHASE' ? 'Sufrida' : 'Efectuada',
        })),
      },
      estadisticas: {
        totalRetencionesProcesadas: taxEntries.length,
        retencionesIsrCount: retencionesIsr.length,
        retencionesIvaCount: retencionesIva.length,
        retencionesCedularCount: retencionesCedular.length,
      },
    };

    return success(result);
  } catch (err) {
    console.error('Error al generar reporte de retenciones:', err);
    return serverError('Error al generar el reporte de retenciones');
  }
}
