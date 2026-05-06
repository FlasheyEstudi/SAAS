import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth, success, error } from '@/lib/api-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateAuth(request);
    if (!user) return error('No autorizado', 401);

    const { id } = await params;

    // 1. Verificar existencia del movimiento
    const movement = await db.bankMovement.findUnique({
      where: { id }
    });

    if (!movement) return error('Movimiento bancario no encontrado', 404);

    // 2. Cambiar estado a RECONCILED
    const updated = await db.bankMovement.update({
      where: { id },
      data: { 
        status: 'RECONCILED',
        updatedAt: new Date()
      }
    });

    return success({
      message: 'Movimiento conciliado exitosamente',
      data: updated
    });

  } catch (err) {
    console.error('Error al conciliar movimiento:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
