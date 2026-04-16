import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/accounts/search - Search accounts by code or name prefix
// Query params: companyId (required), query (min 2 chars)
// Returns top 20 matches. Used for autocomplete in journal entry lines.
// Only returns leaf accounts (isGroup=false) for journal entry usage.
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || '';
    const query = (searchParams.get('query') || '').trim();

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    if (query.length < 2) {
      return error('El parámetro query debe tener al menos 2 caracteres');
    }

    const accounts = await db.account.findMany({
      where: {
        companyId,
        isActive: true,
        isGroup: false, // Only leaf accounts for journal entries
        OR: [
          { code: { contains: query } },
          { name: { contains: query } },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        accountType: true,
        nature: true,
        level: true,
        parentId: true,
        parent: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { code: 'asc' },
      take: 20,
    });

    return success(accounts);
  } catch (err) {
    console.error('Error searching accounts:', err);
    return serverError('Error al buscar cuentas');
  }
}
