import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || '';
    const q = searchParams.get('q') || '';
    const entityType = searchParams.get('entityType') || '';
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    if (q.length < 3) return error('El término de búsqueda debe tener al menos 3 caracteres');

    const results: { entityType: string; items: any[] }[] = [];

    if (!entityType || entityType === 'Company') {
      const items = await db.company.findMany({
        where: companyId ? { id: companyId } : { OR: [{ name: { contains: q } }, { taxId: { contains: q } }] },
        take: limit,
      });
      if (items.length > 0) results.push({ entityType: 'Company', items });
    }

    if (!entityType || entityType === 'Account') {
      const where: Prisma.AccountWhereInput = companyId ? { companyId, OR: [{ name: { contains: q } }, { code: { contains: q } }] } : { OR: [{ name: { contains: q } }, { code: { contains: q } }] };
      const items = await db.account.findMany({ where, take: limit });
      if (items.length > 0) results.push({ entityType: 'Account', items });
    }

    if (!entityType || entityType === 'JournalEntry') {
      const where: Prisma.JournalEntryWhereInput = companyId ? { companyId, description: { contains: q } } : { description: { contains: q } };
      const items = await db.journalEntry.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } });
      if (items.length > 0) results.push({ entityType: 'JournalEntry', items });
    }

    if (!entityType || entityType === 'ThirdParty') {
      const where: Prisma.ThirdPartyWhereInput = companyId ? { companyId, OR: [{ name: { contains: q } }, { taxId: { contains: q } }] } : { OR: [{ name: { contains: q } }, { taxId: { contains: q } }] };
      const items = await db.thirdParty.findMany({ where, take: limit });
      if (items.length > 0) results.push({ entityType: 'ThirdParty', items });
    }

    if (!entityType || entityType === 'Invoice') {
      const where: Prisma.InvoiceWhereInput = companyId ? { companyId, OR: [{ number: { contains: q } }, { description: { contains: q } }] } : { OR: [{ number: { contains: q } }, { description: { contains: q } }] };
      const items = await db.invoice.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } });
      if (items.length > 0) results.push({ entityType: 'Invoice', items });
    }

    if (!entityType || entityType === 'FixedAsset') {
      const where: Prisma.FixedAssetWhereInput = companyId ? { companyId, OR: [{ name: { contains: q } }, { code: { contains: q } }] } : { OR: [{ name: { contains: q } }, { code: { contains: q } }] };
      const items = await db.fixedAsset.findMany({ where, take: limit });
      if (items.length > 0) results.push({ entityType: 'FixedAsset', items });
    }

    if (!entityType || entityType === 'User') {
      const where: Prisma.UserWhereInput = companyId ? { companyId, OR: [{ name: { contains: q } }, { email: { contains: q } }] } : { OR: [{ name: { contains: q } }, { email: { contains: q } }] };
      const items = await db.user.findMany({ where, take: limit, select: { id: true, name: true, email: true, role: true, isActive: true } });
      if (items.length > 0) results.push({ entityType: 'User', items });
    }

    const totalResults = results.reduce((s, r) => s + r.items.length, 0);

    return success({ query: q, companyId, totalResults, results });
  } catch (err) {
    console.error('Error in global search:', err);
    return serverError('Error en búsqueda global');
  }
}
