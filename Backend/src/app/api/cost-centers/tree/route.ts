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
// GET /api/cost-centers/tree - Return full cost center tree for a company
// Query param: companyId (required)
// Each node: { id, code, name, level, isActive, children: [...] }
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || '';

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Fetch ALL cost centers for the company, ordered by code
    const costCenters = await db.costCenter.findMany({
      where: { companyId },
      select: {
        id: true,
        code: true,
        name: true,
        parentId: true,
        level: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });

    // Build the tree from the flat list
    const tree = buildTree(costCenters);

    return success(tree);
  } catch (err) {
    console.error('Error building cost center tree:', err);
    return serverError('Error al obtener el árbol de centros de costo');
  }
}
