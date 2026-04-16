import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const assetType = searchParams.get('assetType') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Prisma.FixedAssetWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (assetType) where.assetType = assetType;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [assets, total] = await Promise.all([
      db.fixedAsset.findMany({
        where,
        include: { _count: { select: { depreciationEntries: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.fixedAsset.count({ where }),
    ]);

    const result: PaginatedResponse<typeof assets[0]> = {
      data: assets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
    return success(result);
  } catch (err) {
    console.error('Error listing fixed assets:', err);
    return serverError('Error al listar activos fijos');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, description, assetType, purchaseDate, purchaseAmount, salvageValue, usefulLifeMonths, depreciationMethod, location, accountId } = body;

    if (!companyId || !name || !assetType || !purchaseDate || !purchaseAmount || !usefulLifeMonths) {
      return error('companyId, name, assetType, purchaseDate, purchaseAmount y usefulLifeMonths son obligatorios');
    }

    const validTypes = ['BUILDING', 'FURNITURE', 'COMPUTER', 'VEHICLE', 'MACHINERY', 'OTHER'];
    if (!validTypes.includes(assetType)) return error('assetType inválido');

    const asset = await db.fixedAsset.create({
      data: {
        companyId, name, description: description || null,
        assetType, purchaseDate: new Date(purchaseDate),
        purchaseAmount: parseFloat(purchaseAmount),
        salvageValue: parseFloat(salvageValue || 0),
        usefulLifeMonths: parseInt(usefulLifeMonths),
        depreciationMethod: depreciationMethod || 'STRAIGHT_LINE',
        currentBookValue: parseFloat(purchaseAmount),
        accumulatedDepreciation: 0,
        location: location || null,
        accountId: accountId || null,
      },
    });

    return created(asset);
  } catch (err) {
    console.error('Error creating fixed asset:', err);
    return serverError('Error al crear activo fijo');
  }
}
