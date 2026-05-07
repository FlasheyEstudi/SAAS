import { db } from '@/lib/db';
import { success, notFound, error, serverError, validateAuth, requireAuth, ensureNotViewer } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';
import { logAudit } from '@/lib/audit-service';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/third-parties/[id] - Get third party with invoice summary
// ============================================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { id } = await context.params;

    const thirdParty = await db.thirdParty.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!thirdParty) {
      return notFound('Tercero no encontrado');
    }

    // Calculate invoice summary
    const invoiceSummary = await db.invoice.aggregate({
      _count: true,
      _sum: {
        totalAmount: true,
        balanceDue: true,
      },
      where: {
        thirdPartyId: id,
        status: { not: 'CANCELLED' },
      },
    });

    return success({
      ...thirdParty,
      invoiceSummary: {
        totalInvoices: invoiceSummary._count || 0,
        totalAmount: invoiceSummary._sum.totalAmount || 0,
        balanceDue: invoiceSummary._sum.balanceDue || 0,
      },
    });
  } catch (err) {
    console.error('Error fetching third party:', err);
    return serverError('Error al obtener el tercero');
  }
}

// ============================================================
// PUT /api/third-parties/[id] - Update third party fields
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const { id } = await context.params;
    const body = await request.json();
    const { name, type, taxId, email, phone, address, city, state, country, isActive } = body;

    // Check third party exists
    const existing = await db.thirdParty.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Tercero no encontrado');
    }

    // Validate type if provided
    if (type && !['CUSTOMER', 'SUPPLIER', 'BOTH'].includes(type)) {
      return error('El tipo debe ser CUSTOMER, SUPPLIER o BOTH');
    }

    const thirdParty = await db.thirdParty.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(taxId !== undefined ? { taxId: taxId?.trim() || null } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(address !== undefined ? { address: address?.trim() || null } : {}),
        ...(city !== undefined ? { city: city?.trim() || null } : {}),
        ...(state !== undefined ? { state: state?.trim() || null } : {}),
        ...(country !== undefined ? { country: country?.trim() || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    // Audit Log
    await logAudit({
      companyId: thirdParty.companyId,
      userId: user!.id,
      action: 'UPDATE',
      entityType: 'ThirdParty',
      entityId: thirdParty.id,
      entityLabel: thirdParty.name,
      oldValues: existing,
      newValues: thirdParty,
    });

    return success(thirdParty);
  } catch (err: unknown) {
    console.error('Error updating third party:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un tercero con ese RFC en la misma empresa');
      }
    }
    return serverError('Error al actualizar el tercero');
  }
}

// ============================================================
// DELETE /api/third-parties/[id] - Delete only if no invoices reference it
// ============================================================
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const { id } = await context.params;

    const thirdParty = await db.thirdParty.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!thirdParty) {
      return notFound('Tercero no encontrado');
    }

    if (thirdParty._count.invoices > 0) {
      return error(
        `No se puede eliminar el tercero. Tiene ${thirdParty._count.invoices} factura(s) asociada(s).`
      );
    }

    // Audit Log
    await logAudit({
      companyId: thirdParty.companyId,
      userId: user!.id,
      action: 'DELETE',
      entityType: 'ThirdParty',
      entityId: thirdParty.id,
      entityLabel: thirdParty.name,
      oldValues: thirdParty,
    });

    await db.thirdParty.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting third party:', err);
    return serverError('Error al eliminar el tercero');
  }
}
