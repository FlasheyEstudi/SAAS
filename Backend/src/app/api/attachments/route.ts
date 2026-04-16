import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const entityType = searchParams.get('entityType') || '';
    const entityId = searchParams.get('entityId') || '';

    const where: Prisma.FileAttachmentWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [attachments, total] = await Promise.all([
      db.fileAttachment.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.fileAttachment.count({ where }),
    ]);

    const result: PaginatedResponse<typeof attachments[0]> = {
      data: attachments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
    return success(result);
  } catch (err) {
    console.error('Error listing attachments:', err);
    return serverError('Error al listar archivos adjuntos');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, entityType, entityId, fileName, fileType, fileSize, fileUrl, uploadedBy } = body;

    if (!companyId || !entityType || !entityId || !fileName || !fileUrl) {
      return error('companyId, entityType, entityId, fileName y fileUrl son obligatorios');
    }

    const attachment = await db.fileAttachment.create({
      data: {
        companyId, entityType, entityId, fileName,
        fileType: fileType || 'application/octet-stream',
        fileSize: parseInt(fileSize || '0'),
        fileUrl,
        uploadedBy: uploadedBy || null,
      },
    });

    return created(attachment);
  } catch (err) {
    console.error('Error creating attachment:', err);
    return serverError('Error al crear archivo adjunto');
  }
}
