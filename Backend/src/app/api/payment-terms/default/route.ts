import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/payment-terms/default - Obtener término de pago por defecto
// Retorna el término de pago más utilizado por la empresa.
// Si no hay datos de uso, retorna el primero activo con menor cantidad de días.
// Parámetro: companyId (requerido)
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Buscar el término más utilizado en facturas de la empresa
    const mostUsed = await db.paymentTerm.findFirst({
      where: {
        companyId,
        isActive: true,
        invoices: { some: {} },
      },
      orderBy: {
        invoices: { _count: 'desc' },
      },
    });

    if (mostUsed) {
      return success({
        data: mostUsed,
        reason: 'Término de pago más utilizado por la empresa',
      });
    }

    // Fallback: retornar el primer término activo ordenado por días (el más corto)
    const firstActive = await db.paymentTerm.findFirst({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: { days: 'asc' },
    });

    if (firstActive) {
      return success({
        data: firstActive,
        reason: 'Primer término de pago activo (sin facturas asociadas)',
      });
    }

    // No hay términos de pago para la empresa
    return error('No se encontraron términos de pago activos para la empresa especificada', 404);
  } catch (err) {
    console.error('Error al obtener término de pago por defecto:', err);
    return serverError('Error al obtener el término de pago por defecto');
  }
}
