import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) return error('entityType y entityId son obligatorios (query params)');

    const attachments = await db.fileAttachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    return success({
      entityType,
      entityId,
      count: attachments.length,
      attachments,
    });
  } catch (err) {
    console.error('Error fetching entity attachments:', err);
    return serverError('Error al obtener archivos adjuntos');
  }
}
