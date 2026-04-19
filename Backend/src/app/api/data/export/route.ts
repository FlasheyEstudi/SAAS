import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

const VALID_ENTITIES = [
  'Company', 'AccountingPeriod', 'Account', 'CostCenter',
  'JournalEntry', 'JournalEntryLine', 'ThirdParty', 'Invoice',
  'BankAccount', 'BankMovement', 'User', 'AuditLog',
  'ExchangeRate', 'FixedAsset', 'Budget', 'Notification', 'FileAttachment',
];

const entityToModel: Record<string, { model: any; companyIdField: string }> = {
  Company: { model: db.company, companyIdField: 'id' },
  AccountingPeriod: { model: db.accountingPeriod, companyIdField: 'companyId' },
  Account: { model: db.account, companyIdField: 'companyId' },
  CostCenter: { model: db.costCenter, companyIdField: 'companyId' },
  JournalEntry: { model: db.journalEntry, companyIdField: 'companyId' },
  JournalEntryLine: { model: db.journalEntryLine, companyIdField: '' },
  ThirdParty: { model: db.thirdParty, companyIdField: 'companyId' },
  Invoice: { model: db.invoice, companyIdField: 'companyId' },
  BankAccount: { model: db.bankAccount, companyIdField: 'companyId' },
  BankMovement: { model: db.bankMovement, companyIdField: '' },
  User: { model: db.user, companyIdField: 'companyId' },
  AuditLog: { model: db.auditLog, companyIdField: 'companyId' },
  ExchangeRate: { model: db.exchangeRate, companyIdField: 'companyId' },
  FixedAsset: { model: db.fixedAsset, companyIdField: 'companyId' },
  Budget: { model: db.budget, companyIdField: 'companyId' },
  Notification: { model: db.notification, companyIdField: 'companyId' },
  FileAttachment: { model: db.fileAttachment, companyIdField: 'companyId' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const companyId = searchParams.get('companyId');
  return handleExport(entityType, companyId, {});
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, companyId, filters } = body;
    return handleExport(entityType, companyId, filters);
  } catch {
    return error('Cuerpo de solicitud inválido');
  }
}

async function handleExport(entityType: string | null, companyId: string | null, filters: any) {
  try {

    if (!entityType || !VALID_ENTITIES.includes(entityType)) {
      return error(`entityType inválido. Valores permitidos: ${VALID_ENTITIES.join(', ')}`);
    }

    const entityConfig = entityToModel[entityType];
    if (!entityConfig) return error('Entidad no soportada para exportación');

    const where: Record<string, unknown> = {};
    if (companyId && entityConfig.companyIdField) {
      if (entityType === 'Company') {
        where.id = companyId;
      } else {
        where[entityConfig.companyIdField] = companyId;
      }
    }

    if (filters && typeof filters === 'object') {
      Object.assign(where, filters);
    }

    const data = await entityConfig.model.findMany({
      where,
      take: 10000,
    });

    return success({
      entityType,
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      data,
    });
  } catch (err) {
    console.error('Error exporting data:', err);
    return serverError('Error al exportar datos');
  }
}
