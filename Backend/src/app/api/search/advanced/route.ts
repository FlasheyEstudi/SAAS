import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

interface SearchCriterion {
  entityType: string;
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: unknown;
}

function buildWhere(criterion: SearchCriterion): Record<string, unknown> {
  const fieldPath = criterion.field.split('.');
  let where: Record<string, unknown> = {};

  const buildCondition = (field: string, operator: string, value: unknown) => {
    switch (operator) {
      case 'eq': return { equals: value };
      case 'ne': return { not: value };
      case 'contains': return { contains: String(value) };
      case 'startsWith': return { startsWith: String(value) };
      case 'endsWith': return { endsWith: String(value) };
      case 'gt': return { gt: value };
      case 'gte': return { gte: value };
      case 'lt': return { lt: value };
      case 'lte': return { lte: value };
      case 'in': return { in: Array.isArray(value) ? value : [value] };
      default: return { contains: String(value) };
    }
  };

  if (fieldPath.length === 1) {
    where[fieldPath[0]] = buildCondition(fieldPath[0], criterion.operator, criterion.value);
  }

  return where;
}

const ENTITY_MODELS: Record<string, any> = {
  Company: db.company,
  Account: db.account,
  CostCenter: db.costCenter,
  JournalEntry: db.journalEntry,
  ThirdParty: db.thirdParty,
  Invoice: db.invoice,
  BankAccount: db.bankAccount,
  User: db.user,
  FixedAsset: db.fixedAsset,
  Budget: db.budget,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { criteria, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = body;

    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return error('criteria debe ser un array no vacío de { entityType, field, operator, value }');
    }

    if (criteria.length > 10) return error('Máximo 10 criterios por búsqueda');

    const groupedByEntity: Record<string, SearchCriterion[]> = {};
    for (const c of criteria) {
      if (!c.entityType || !c.field || !c.operator || c.value === undefined) {
        return error('Cada criterio debe tener entityType, field, operator y value');
      }
      if (!ENTITY_MODELS[c.entityType]) {
        return error(`entityType "${c.entityType}" no soportado. Valores: ${Object.keys(ENTITY_MODELS).join(', ')}`);
      }
      if (!groupedByEntity[c.entityType]) groupedByEntity[c.entityType] = [];
      groupedByEntity[c.entityType].push(c);
    }

    const results: { entityType: string; items: any[]; total: number }[] = [];

    for (const [entityType, entityCriteria] of Object.entries(groupedByEntity)) {
      const andConditions = entityCriteria.map(c => buildWhere(c));
      const where: Record<string, unknown> = { AND: andConditions };

      const [items, total] = await Promise.all([
        ENTITY_MODELS[entityType].findMany({
          where,
          take: Math.min(limit, 100),
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        ENTITY_MODELS[entityType].count({ where }),
      ]);

      if (items.length > 0) {
        results.push({ entityType, items, total });
      }
    }

    const totalResults = results.reduce((s, r) => s + r.total, 0);

    return success({
      totalResults,
      entityResults: results,
      criteriaCount: criteria.length,
    });
  } catch (err) {
    console.error('Error in advanced search:', err);
    return serverError('Error en búsqueda avanzada');
  }
}
