import { db } from '@/lib/db';
import { success, error, serverError, created } from '@/lib/api-helpers';

const VALID_ENTITIES = [
  'Company', 'AccountingPeriod', 'Account', 'CostCenter',
  'JournalEntry', 'JournalEntryLine', 'ThirdParty', 'Invoice',
  'BankAccount', 'BankMovement', 'User', 'AuditLog',
  'ExchangeRate', 'FixedAsset', 'Budget', 'Notification', 'FileAttachment',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, data } = body;

    if (!entityType || !VALID_ENTITIES.includes(entityType)) {
      return error(`entityType inválido. Valores permitidos: ${VALID_ENTITIES.join(', ')}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      return error('data debe ser un array no vacío');
    }

    if (data.length > 1000) {
      return error('Máximo 1000 registros por importación');
    }

    const importHandlers: Record<string, (items: any[]) => Promise<number>> = {
      Company: async (items) => {
        let count = 0;
        for (const item of items) {
          try {
            await db.company.create({
              data: {
                name: item.name,
                taxId: item.taxId || '',
                logoUrl: item.logoUrl || null,
                address: item.address || null,
                phone: item.phone || null,
                email: item.email || null,
                currency: item.currency || 'MXN',
              },
            });
            count++;
          } catch { /* skip duplicates */ }
        }
        return count;
      },
      User: async (items) => {
        let count = 0;
        for (const item of items) {
          try {
            await db.user.create({
              data: {
                companyId: item.companyId,
                name: item.name,
                email: item.email,
                passwordHash: item.passwordHash || Buffer.from('123456').toString('base64'),
                role: item.role || 'USER',
              },
            });
            count++;
          } catch { /* skip duplicates */ }
        }
        return count;
      },
      ExchangeRate: async (items) => {
        let count = 0;
        for (const item of items) {
          try {
            await db.exchangeRate.create({
              data: {
                companyId: item.companyId,
                fromCurrency: item.fromCurrency,
                toCurrency: item.toCurrency,
                rate: parseFloat(item.rate),
                effectiveDate: new Date(item.effectiveDate),
                source: item.source || 'MANUAL',
              },
            });
            count++;
          } catch { /* skip duplicates */ }
        }
        return count;
      },
      Notification: async (items) => {
        let count = 0;
        const results = await db.notification.createMany({
          data: items.map(item => ({
            companyId: item.companyId || '',
            userId: item.userId || null,
            type: item.type || 'INFO',
            title: item.title || '',
            message: item.message || '',
            link: item.link || null,
          })),
          skipDuplicates: true,
        });
        return results.count;
      },
      AuditLog: async (items) => {
        const results = await db.auditLog.createMany({
          data: items.map(item => ({
            companyId: item.companyId || '',
            userId: item.userId || null,
            action: item.action || 'IMPORT',
            entityType: item.entityType || 'System',
            entityId: item.entityId || null,
            entityLabel: item.entityLabel || null,
            details: item.details || null,
            ipAddress: item.ipAddress || null,
          })),
          skipDuplicates: true,
        });
        return results.count;
      },
    };

    const handler = importHandlers[entityType];
    if (!handler) {
      return error(`Importación no soportada para ${entityType}. Entidades soportadas: Company, User, ExchangeRate, Notification, AuditLog`);
    }

    const importedCount = await handler(data);

    return created({
      entityType,
      totalRequested: data.length,
      importedCount,
      skipped: data.length - importedCount,
    });
  } catch (err) {
    console.error('Error importing data:', err);
    return serverError('Error al importar datos');
  }
}
