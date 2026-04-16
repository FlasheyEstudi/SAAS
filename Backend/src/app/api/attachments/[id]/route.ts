import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const attachment = await db.fileAttachment.findUnique({ where: { id } });
    if (!attachment) return notFound('Archivo adjunto no encontrado');
    return success(attachment);
  } catch (err) {
    console.error('Error fetching attachment:', err);
    return serverError('Error al obtener archivo adjunto');
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
