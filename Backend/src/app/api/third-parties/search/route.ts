import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/third-parties/search - Search third parties by name or taxId prefix
// Used for autocomplete. Returns top 20 results.
// Query params: companyId (required), query (min 2 chars)
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
      return success({ data: [] });
    }

    const thirdParties = await db.thirdParty.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { name: { contains: query } },
          { taxId: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        taxId: true,
        type: true,
        email: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return success({ data: thirdParties });
  } catch (err) {
    console.error('Error searching third parties:', err);
    return serverError('Error al buscar terceros');
  }
}
