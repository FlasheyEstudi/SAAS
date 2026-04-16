import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/tax/rates - Listar tasas de impuesto
// Filtros: companyId (requerido), taxType, isActive
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const taxType = searchParams.get('taxType') || '';
    const isActive = searchParams.get('isActive');

    // Construir cláusula where
    const where: Prisma.TaxRateWhereInput = { companyId };

    if (taxType) {
      const validTypes = ['IVA', 'ISR', 'RET_IVA', 'RET_ISR', 'IEPS', 'CEDULAR'];
      if (validTypes.includes(taxType)) {
        where.taxType = taxType;
      } else {
        return error(`Tipo de impuesto inválido. Valores permitidos: ${validTypes.join(', ')}`);
      }
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [rates, total] = await Promise.all([
      db.taxRate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.taxRate.count({ where }),
    ]);

    const result: PaginatedResponse<typeof rates[0]> = {
      data: rates,
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
    console.error('Error al listar tasas de impuesto:', err);
    return serverError('Error al listar las tasas de impuesto');
  }
}

// ============================================================
// POST /api/tax/rates - Crear nueva tasa de impuesto
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyId,
      taxType,
      rate,
      name,
      description,
      isRetention,
      effectiveFrom,
      effectiveTo,
    } = body;

    // Validar campos obligatorios
    if (!companyId) {
      return error('El companyId es obligatorio');
    }
    if (!taxType) {
      return error('El taxType es obligatorio');
    }
    const validTypes = ['IVA', 'ISR', 'RET_IVA', 'RET_ISR', 'IEPS', 'CEDULAR'];
    if (!validTypes.includes(taxType)) {
      return error(`Tipo de impuesto inválido. Valores permitidos: ${validTypes.join(', ')}`);
    }
    if (rate === undefined || rate === null || rate < 0) {
      return error('La tasa (rate) es obligatoria y debe ser mayor o igual a 0');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre de la tasa es obligatorio');
    }
    if (!effectiveFrom) {
      return error('La fecha de vigencia (effectiveFrom) es obligatoria');
    }

    // Verificar que la empresa existe
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    // Si es retención, el taxType debe coincidir
    const retentionTypes = ['RET_IVA', 'RET_ISR', 'CEDULAR'];
    if (isRetention && !retentionTypes.includes(taxType)) {
      return error(`Para retenciones, el taxType debe ser uno de: ${retentionTypes.join(', ')}`);
    }

    const taxRate = await db.taxRate.create({
      data: {
        companyId,
        taxType,
        rate: parseFloat(rate),
        name: name.trim(),
        description: description?.trim() || null,
        isRetention: isRetention === true,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
    });

    return created(taxRate);
  } catch (err: unknown) {
    console.error('Error al crear tasa de impuesto:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La empresa especificada no existe');
      }
    }
    return serverError('Error al crear la tasa de impuesto');
  }
}
