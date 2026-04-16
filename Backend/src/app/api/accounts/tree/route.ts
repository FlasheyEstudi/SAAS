import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// Helper: Build tree structure from flat list
// ============================================================
function buildTree(items: any[], parentId: string | null = null): any[] {
  return items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id),
    }));
}

// ============================================================
// GET /api/accounts/tree - Return full account tree for a company
// Query param: companyId (required)
// Each node: { id, code, name, accountType, nature, level, isGroup, isActive, children: [...] }
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || '';

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Fetch ALL accounts for the company, ordered by code
    const accounts = await db.account.findMany({
      where: { companyId },
      select: {
        id: true,
        code: true,
        name: true,
        parentId: true,
        accountType: true,
        nature: true,
        level: true,
        isGroup: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });

    // Build the tree from the flat list
    const tree = buildTree(accounts);

    return success(tree);
  } catch (err) {
    console.error('Error building account tree:', err);
    return serverError('Error al obtener el árbol de cuentas');
  }
}
