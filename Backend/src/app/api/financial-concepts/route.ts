import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// Categorías válidas para conceptos financieros
const VALID_CATEGORIES = ['NOMINA', 'SERVICIO', 'IMPUESTO', 'ANTICIPO', 'TRASPASO', 'AJUSTE', 'OTRO'];

// ============================================================
// GET /api/financial-concepts - Listar conceptos financieros con paginación y filtros
// Parámetros: companyId (requerido), category (opcional), isActive (opcional)
// Incluye las relaciones a Account y CostCenter en la respuesta
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');

    // Construir cláusula WHERE
    const where: Prisma.FinancialConceptWhereInput = { companyId };

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    } else if (category) {
      return error(`Categoría inválida. Las categorías válidas son: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [concepts, total] = await Promise.all([
      db.financialConcept.findMany({
        where,
        include: {
          account: true,
          costCenter: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.financialConcept.count({ where }),
    ]);

    const result: PaginatedResponse<(typeof concepts)[0]> = {
      data: concepts,
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
    console.error('Error al listar conceptos financieros:', err);
    return serverError('Error al listar conceptos financieros');
  }
}

// ============================================================
// POST /api/financial-concepts - Crear un nuevo concepto financiero
// El código debe ser único por empresa (ej: ANT-IBS, NOM-QUIN, SER-PROF)
// La categoría es obligatoria y debe ser una de las válidas
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, code, name, category, defaultAccountId, defaultCostCenterId, isActive } = body;

    // Validar campos obligatorios
    if (!companyId) {
      return error('El companyId es obligatorio');
    }
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return error('El código del concepto financiero es obligatorio');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre del concepto financiero es obligatorio');
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return error(`La categoría es obligatoria. Valores válidos: ${VALID_CATEGORIES.join(', ')}`);
    }

    // Verificar que la empresa existe
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    // Verificar que la cuenta contable existe (si se proporciona)
    if (defaultAccountId) {
      const account = await db.account.findUnique({ where: { id: defaultAccountId } });
      if (!account) {
        return error('La cuenta contable por defecto especificada no existe');
      }
    }

    // Verificar que el centro de costo existe (si se proporciona)
    if (defaultCostCenterId) {
      const costCenter = await db.costCenter.findUnique({ where: { id: defaultCostCenterId } });
      if (!costCenter) {
        return error('El centro de costo por defecto especificado no existe');
      }
    }

    // Verificar unicidad del código por empresa
    const existingCode = await db.financialConcept.findUnique({
      where: { companyId_code: { companyId, code: code.trim().toUpperCase() } },
    });
    if (existingCode) {
      return error(`Ya existe un concepto financiero con el código "${code.trim().toUpperCase()}" en esta empresa`);
    }

    const concept = await db.financialConcept.create({
      data: {
        companyId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        defaultAccountId: defaultAccountId || null,
        defaultCostCenterId: defaultCostCenterId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        account: true,
        costCenter: true,
      },
    });

    return created(concept);
  } catch (err: unknown) {
    console.error('Error al crear concepto financiero:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un concepto financiero con ese código en la empresa');
      }
      if (err.code === 'P2003') {
        return error('La empresa, cuenta contable o centro de costo especificado no existe');
      }
    }
    return serverError('Error al crear el concepto financiero');
  }
}
