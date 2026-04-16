import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

const VALID_ENTITIES = [
  'Company', 'AccountingPeriod', 'Account', 'CostCenter',
  'JournalEntry', 'ThirdParty', 'Invoice', 'BankAccount',
  'User', 'FixedAsset', 'Budget',
];

const entityToModel: Record<string, { model: any; companyIdField: string }> = {
  Company: { model: db.company, companyIdField: 'id' },
  AccountingPeriod: { model: db.accountingPeriod, companyIdField: 'companyId' },
  Account: { model: db.account, companyIdField: 'companyId' },
  CostCenter: { model: db.costCenter, companyIdField: 'companyId' },
  JournalEntry: { model: db.journalEntry, companyIdField: 'companyId' },
  ThirdParty: { model: db.thirdParty, companyIdField: 'companyId' },
  Invoice: { model: db.invoice, companyIdField: 'companyId' },
  BankAccount: { model: db.bankAccount, companyIdField: 'companyId' },
  User: { model: db.user, companyIdField: 'companyId' },
  FixedAsset: { model: db.fixedAsset, companyIdField: 'companyId' },
  Budget: { model: db.budget, companyIdField: 'companyId' },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const companyId = searchParams.get('companyId');
    const fields = searchParams.get('fields');

    if (!entityType || !VALID_ENTITIES.includes(entityType)) {
      return error(`entityType inválido. Valores: ${VALID_ENTITIES.join(', ')}`);
    }

    const entityConfig = entityToModel[entityType];
    if (!entityConfig) return error('Entidad no soportada');

    const where: Record<string, unknown> = {};
    if (companyId) {
      if (entityType === 'Company') {
        where.id = companyId;
      } else {
        where[entityConfig.companyIdField] = companyId;
      }
    }

    const select: Record<string, boolean> = {};
    if (fields) {
      const fieldList = fields.split(',');
      for (const f of fieldList) {
        const trimmed = f.trim();
        if (trimmed) select[trimmed] = true;
      }
      if (!select.id) select.id = true;
    }

    const data = await entityConfig.model.findMany({
      where,
      select: Object.keys(select).length > 0 ? select : undefined,
      take: 10000,
    });

    const items = data.map((item: any) => {
      const plain = { ...item };
      for (const key of Object.keys(plain)) {
        if (plain[key] instanceof Date) {
          plain[key] = plain[key].toISOString();
        }
      }
      return plain;
    });

    const allKeys = new Set<string>();
    for (const item of items) {
      for (const key of Object.keys(item)) allKeys.add(key);
    }
    const headers = Array.from(allKeys);

    const csvRows: string[] = [];
    csvRows.push(headers.map(h => `"${h}"`).join(','));
    for (const item of items) {
      const row = headers.map(h => {
        const val = item[h];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${entityType.toLowerCase()}_export.csv"`,
      },
    });
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return serverError('Error al exportar datos CSV');
  }
}
