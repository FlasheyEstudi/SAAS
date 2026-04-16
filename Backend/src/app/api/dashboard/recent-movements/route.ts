import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/dashboard/recent-movements - Last 5 journal entries (POSTED)
// Query params: companyId (required)
// Returns newest 5 entries ordered by entryDate desc,
// including lines with account info.
// ============================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const recentEntries = await db.journalEntry.findMany({
      where: {
        companyId,
        status: 'POSTED',
      },
      include: {
        period: {
          select: { id: true, year: true, month: true, status: true },
        },
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true, accountType: true },
            },
            costCenter: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { entryDate: 'desc' },
      take: 5,
    });

    return success(recentEntries);
  } catch (err) {
    console.error('Error fetching recent movements:', err);
    return serverError('Error al obtener los movimientos recientes');
  }
}
