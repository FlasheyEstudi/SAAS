import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const attachment = await db.fileAttachment.findUnique({
       where: { id },
       include: { company: { select: { id: true, name: true } } }
    });
    if (!attachment) return notFound('Archivo adjunto no encontrado');
    return success(attachment);
  } catch (err) {
    console.error('Error fetching attachment:', err);
    return serverError('Error al obtener archivo adjunto');
  }
}

// ============================================================
// PUT /api/attachments/[id] - Update attachment metadata
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { fileName, description } = body;

    const existing = await db.fileAttachment.findUnique({ where: { id } });
    if (!existing) return notFound('Archivo adjunto no encontrado');

    const attachment = await db.fileAttachment.update({
      where: { id },
      data: {
        ...(fileName !== undefined ? { fileName } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return success(attachment);
  } catch (err) {
    console.error('Error updating attachment:', err);
    return serverError('Error al actualizar archivo adjunto');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const attachment = await db.fileAttachment.findUnique({ where: { id } });
    if (!attachment) return notFound('Archivo adjunto no encontrado');

    await db.fileAttachment.delete({ where: { id } });
    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting attachment:', err);
    return serverError('Error al eliminar archivo adjunto');
  }
}
