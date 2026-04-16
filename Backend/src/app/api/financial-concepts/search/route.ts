import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/financial-concepts/search - Buscar conceptos financieros
// Búsqueda por código o nombre (case-insensitive con contains).
// Útil para autocomplete en formularios.
// Parámetros: companyId (requerido), query (mínimo 2 caracteres)
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const query = searchParams.get('query') || '';

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    if (query.length < 2) {
      return success({ data: [], total: 0 });
    }

    const concepts = await db.financialConcept.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { code: { contains: query } },
          { name: { contains: query } },
        ],
      },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
        costCenter: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { code: 'asc' },
      take: 20,
    });

    return success({
      data: concepts,
      total: concepts.length,
    });
  } catch (err) {
    console.error('Error al buscar conceptos financieros:', err);
    return serverError('Error al buscar conceptos financieros');
  }
}
