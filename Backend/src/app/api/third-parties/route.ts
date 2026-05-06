import { db } from '@/lib/db';
import {
  success,
  error,
  parsePagination,
  serverError,
  validateAuth,
  requireAuth,
} from '@/lib/api-helpers';
import { thirdPartySchema } from '@/lib/schemas/inventory';
import { logAudit } from '@/lib/audit-service';
import { NextRequest } from 'next/server';

// ============================================================
// GET /api/third-parties - List third parties with pagination & filters
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) return error('El parámetro companyId es obligatorio');

    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    const where: any = { companyId };
    if (type) where.type = type as any;
    if (isActive !== null) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { taxId: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [thirdPartiesRaw, total] = await Promise.all([
      db.thirdParty.findMany({
        where,
        include: { 
          _count: { select: { invoices: true } },
          invoices: {
            where: { status: { not: 'CANCELLED' } },
            select: { balanceDue: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.thirdParty.count({ where }),
    ]);

    // Calcular el balance total para cada tercero
    const thirdParties = thirdPartiesRaw.map(tp => {
      const balance = tp.invoices.reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);
      const { invoices, ...rest } = tp;
      return { ...rest, balance };
    });

    return success({
      data: thirdParties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('[GET /api/third-parties]', err);
    return serverError();
  }
}

// ============================================================
// POST /api/third-parties - Create a new third party
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    
    // 1. Validar con Zod (100/100)
    const result = thirdPartySchema.safeParse(body);
    if (!result.success) {
      return error(result.error.issues[0].message);
    }
    const data = result.data;

    // 2. Crear tercero
    const thirdParty = await db.thirdParty.create({
      data: {
        companyId: data.companyId,
        name: data.name.trim(),
        type: data.type as any,
        taxId: data.taxId?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        isActive: data.isActive,
      },
      include: {
        _count: { select: { invoices: true } },
      },
    });

    // 3. Registrar auditoría
    await logAudit({
      companyId: data.companyId,
      userId: user!.id,
      action: 'CREATE',
      entityType: 'ThirdParty',
      entityId: thirdParty.id,
      entityLabel: thirdParty.name,
      newValues: thirdParty,
    });

    return success(thirdParty, 201);
  } catch (err: unknown) {
    console.error('[POST /api/third-parties]', err);
    return serverError();
  }
}
