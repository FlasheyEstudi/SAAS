import { db } from '@/lib/db';
import { success, error, serverError, parsePagination } from '@/lib/api-helpers';

// ============================================================
// GET /api/closing-entries - Listar asientos de cierre
// Query params: companyId (requerido), periodId, closingType, page, limit
//
// Devuelve los asientos de cierre filtrados por empresa, período y tipo.
// Soporta paginación estándar.
// ============================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const closingType = searchParams.get('closingType');
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Construir filtro dinámico
    const where: Record<string, unknown> = { companyId };
    if (periodId) where.periodId = periodId;
    if (closingType) where.closingType = closingType;

    // Obtener total y registros paginados
    const [total, closingEntries] = await Promise.all([
      db.closingEntry.count({ where }),
      db.closingEntry.findMany({
        where,
        include: {
          period: {
            select: { id: true, year: true, month: true, status: true },
          },
          journalEntry: {
            select: {
              id: true,
              entryNumber: true,
              description: true,
              entryDate: true,
              status: true,
              totalDebit: true,
              totalCredit: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return success({
      closingEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('Error al listar asientos de cierre:', err);
    return serverError('Error al obtener los asientos de cierre');
  }
}
