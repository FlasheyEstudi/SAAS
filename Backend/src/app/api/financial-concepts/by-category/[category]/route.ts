import { db } from '@/lib/db';
import { success, error, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ category: string }> };

// Categorías válidas para conceptos financieros
const VALID_CATEGORIES = ['NOMINA', 'SERVICIO', 'IMPUESTO', 'ANTICIPO', 'TRASPASO', 'AJUSTE', 'OTRO'];

// Nombres legibles para cada categoría
const CATEGORY_NAMES: Record<string, string> = {
  NOMINA: 'Nómina',
  SERVICIO: 'Servicio',
  IMPUESTO: 'Impuesto',
  ANTICIPO: 'Anticipo',
  TRASPASO: 'Traspaso',
  AJUSTE: 'Ajuste',
  OTRO: 'Otro',
};

// ============================================================
// GET /api/financial-concepts/by-category/[category] - Listar conceptos por categoría
// Filtra conceptos financieros activos de una categoría específica para una empresa.
// Categorías válidas: NOMINA, SERVICIO, IMPUESTO, ANTICIPO, TRASPASO, AJUSTE, OTRO
// Parámetro: companyId (requerido) en query string
// Parámetro: category en la URL
// ============================================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const { category } = await context.params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Validar categoría
    if (!VALID_CATEGORIES.includes(category)) {
      return error(`Categoría "${category}" inválida. Las categorías válidas son: ${VALID_CATEGORIES.join(', ')}`);
    }

    const concepts = await db.financialConcept.findMany({
      where: {
        companyId,
        category: category.toUpperCase(),
        isActive: true,
      },
      include: {
        account: true,
        costCenter: true,
      },
      orderBy: { code: 'asc' },
    });

    return success({
      category: category.toUpperCase(),
      categoryName: CATEGORY_NAMES[category.toUpperCase()] || category,
      companyId,
      total: concepts.length,
      data: concepts,
    });
  } catch (err) {
    console.error(`Error al listar conceptos de categoría:`, err);
    return serverError('Error al listar conceptos por categoría');
  }
}
