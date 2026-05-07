import { db } from '@/lib/db';
import { success, notFound, error, serverError, validateAuth, requireAuth, ensureNotViewer } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit-service';
import { Prisma } from '@prisma/client';

// Helper to extract ID from dynamic route segment
type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/companies/[id] - Get single company by ID
// ============================================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { id } = await context.params;

    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            accountingPeriods: true,
            accounts: true,
            journalEntries: true,
            thirdParties: true,
            invoices: true,
            bankAccounts: true,
            costCenters: true,
          },
        },
      },
    });

    if (!company) {
      return notFound('Empresa no encontrada');
    }

    return success(company);
  } catch (err) {
    console.error('Error fetching company:', err);
    return serverError('Error al obtener la empresa');
  }
}

// ============================================================
// PUT /api/companies/[id] - Update company fields
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
    const { name, taxId, logoUrl, address, phone, email, currency } = body;

    // Check company exists
    const existing = await db.company.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Empresa no encontrada');
    }

    // Validate name uniqueness if changing
    if (name && name.trim() !== existing.name) {
      const duplicate = await db.company.findFirst({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return error('Ya existe una empresa con ese nombre');
      }
    }

    const company = await db.company.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(taxId !== undefined ? { taxId: taxId.trim() } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(currency !== undefined ? { currency } : {}),
      },
      include: {
        _count: {
          select: {
            accountingPeriods: true,
            accounts: true,
            journalEntries: true,
          },
        },
      },
    });

    // Audit Log
    await logAudit({
      companyId: company.id,
      userId: user!.id,
      action: 'UPDATE',
      entityType: 'Company',
      entityId: company.id,
      entityLabel: company.name,
      oldValues: existing,
      newValues: company,
    });

    return success(company);
  } catch (err: unknown) {
    console.error('Error updating company:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una empresa con ese nombre o RFC');
      }
    }
    return serverError('Error al actualizar la empresa');
  }
}

// ============================================================
// DELETE /api/companies/[id] - Soft/hard delete company
// ============================================================
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const { id } = await context.params;

    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            accountingPeriods: true,
            accounts: true,
            journalEntries: true,
            thirdParties: true,
            invoices: true,
            bankAccounts: true,
            costCenters: true,
          },
        },
      },
    });

    if (!company) {
      return notFound('Empresa no encontrada');
    }

    const counts = company._count;
    const totalRelated =
      counts.accountingPeriods +
      counts.accounts +
      counts.journalEntries +
      counts.thirdParties +
      counts.invoices +
      counts.bankAccounts +
      counts.costCenters;

    if (totalRelated > 0) {
      return error(
        `No se puede eliminar la empresa. Tiene datos relacionados: ` +
        `${counts.accountingPeriods} períodos, ${counts.accounts} cuentas, ` +
        `${counts.journalEntries} pólizas, ${counts.thirdParties} terceros, ` +
        `${counts.invoices} facturas, ${counts.bankAccounts} cuentas bancarias, ` +
        `${counts.costCenters} centros de costo.`
      );
    }

    // Audit Log
    await logAudit({
      companyId: company.id,
      userId: user!.id,
      action: 'DELETE',
      entityType: 'Company',
      entityId: company.id,
      entityLabel: company.name,
      oldValues: company,
    });

    await db.company.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting company:', err);
    return serverError('Error al eliminar la empresa');
  }
}
