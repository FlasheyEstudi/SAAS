import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/tax/entries - Listar entradas de impuesto
// Filtros: companyId (requerido), invoiceId, taxType, isRetention
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const invoiceId = searchParams.get('invoiceId') || '';
    const taxType = searchParams.get('taxType') || '';
    const isRetention = searchParams.get('isRetention');

    // Construir cláusula where
    const where: Prisma.TaxEntryWhereInput = { companyId };

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (taxType) {
      const validTypes = ['IVA', 'ISR', 'RET_IVA', 'RET_ISR', 'IEPS', 'CEDULAR'];
      if (validTypes.includes(taxType)) {
        where.taxType = taxType;
      } else {
        return error(`Tipo de impuesto inválido. Valores permitidos: ${validTypes.join(', ')}`);
      }
    }

    if (isRetention !== null && isRetention !== undefined && isRetention !== '') {
      where.isRetention = isRetention === 'true';
    }

    const [entries, total] = await Promise.all([
      db.taxEntry.findMany({
        where,
        include: {
          taxRate: {
            select: { id: true, name: true, rate: true, taxType: true },
          },
          invoice: {
            select: {
              id: true,
              number: true,
              invoiceType: true,
              totalAmount: true,
              thirdParty: {
                select: { id: true, name: true, taxId: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.taxEntry.count({ where }),
    ]);

    const result: PaginatedResponse<typeof entries[0]> = {
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    return success(result);
  } catch (err) {
    console.error('Error al listar entradas de impuesto:', err);
    return serverError('Error al listar las entradas de impuesto');
  }
}

// ============================================================
// POST /api/tax/entries - Crear entrada de impuesto para una factura
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyId,
      invoiceId,
      taxRateId,
      taxType,
      taxableBase,
      taxAmount,
      withholdingAmount,
      isRetention,
    } = body;

    // Validar campos obligatorios
    if (!companyId) {
      return error('El companyId es obligatorio');
    }
    if (!invoiceId) {
      return error('El invoiceId es obligatorio');
    }
    if (!taxRateId) {
      return error('El taxRateId es obligatorio');
    }
    if (!taxType) {
      return error('El taxType es obligatorio');
    }
    const validTypes = ['IVA', 'ISR', 'RET_IVA', 'RET_ISR', 'IEPS', 'CEDULAR'];
    if (!validTypes.includes(taxType)) {
      return error(`Tipo de impuesto inválido. Valores permitidos: ${validTypes.join(', ')}`);
    }
    if (taxableBase === undefined || taxableBase === null || taxableBase < 0) {
      return error('La base gravable (taxableBase) es obligatoria y debe ser mayor o igual a 0');
    }
    if (taxAmount === undefined || taxAmount === null || taxAmount < 0) {
      return error('El monto del impuesto (taxAmount) es obligatorio y debe ser mayor o igual a 0');
    }

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, companyId: true, invoiceType: true },
    });
    if (!invoice) {
      return error('La factura especificada no existe');
    }
    if (invoice.companyId !== companyId) {
      return error('La factura no pertenece a la empresa especificada');
    }

    // Verificar que la tasa de impuesto existe
    const taxRate = await db.taxRate.findUnique({
      where: { id: taxRateId },
      select: { id: true, companyId: true, taxType: true, rate: true, isActive: true },
    });
    if (!taxRate) {
      return error('La tasa de impuesto especificada no existe');
    }
    if (taxRate.companyId !== companyId) {
      return error('La tasa de impuesto no pertenece a la empresa especificada');
    }
    if (!taxRate.isActive) {
      return error('La tasa de impuesto está desactivada');
    }

    // Crear la entrada de impuesto
    const taxEntry = await db.taxEntry.create({
      data: {
        companyId,
        invoiceId,
        taxRateId,
        taxType,
        taxableBase: parseFloat(taxableBase),
        taxAmount: parseFloat(taxAmount),
        withholdingAmount: parseFloat(withholdingAmount || 0),
        isRetention: isRetention === true,
      },
      include: {
        taxRate: {
          select: { id: true, name: true, rate: true, taxType: true },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            invoiceType: true,
          },
        },
      },
    });

    return created(taxEntry);
  } catch (err: unknown) {
    console.error('Error al crear entrada de impuesto:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La empresa, factura o tasa de impuesto especificada no existe');
      }
    }
    return serverError('Error al crear la entrada de impuesto');
  }
}
