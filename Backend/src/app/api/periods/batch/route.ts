import { db } from '@/lib/db';
import { created, error, serverError } from '@/lib/api-helpers';

// ============================================================
// POST /api/periods/batch - Batch create periods for a full year (12 months)
// Input: { companyId, year }
// Creates 12 periods (January-December) all as OPEN status
// Skips any months that already exist for the company+year
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, year } = body;

    // Validate required fields
    if (!companyId || typeof companyId !== 'string') {
      return error('El ID de la empresa es obligatorio');
    }
    if (year === undefined || typeof year !== 'number') {
      return error('El año es obligatorio');
    }

    // Validate year range
    if (year < 2020 || year > 2030) {
      return error('El año debe estar entre 2020 y 2030');
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    // Find existing periods for this company+year to skip duplicates
    const existingPeriods = await db.accountingPeriod.findMany({
      where: { companyId, year },
      select: { month: true },
    });
    const existingMonths = new Set(existingPeriods.map(p => p.month));

    // Build the 12 months, skipping existing ones
    const monthsToCreate: number[] = [];
    for (let month = 1; month <= 12; month++) {
      if (!existingMonths.has(month)) {
        monthsToCreate.push(month);
      }
    }

    if (monthsToCreate.length === 0) {
      return created({
        message: `Todos los períodos para ${company.name} - ${year} ya existen`,
        created: 0,
        skipped: 12,
        periods: [],
      });
    }

    // Create all periods in a single transaction for atomicity
    const createdPeriods = await db.$transaction(
      monthsToCreate.map(month =>
        db.accountingPeriod.create({
          data: {
            companyId,
            year,
            month,
            status: 'OPEN',
          },
          include: {
            company: {
              select: { id: true, name: true, taxId: true },
            },
          },
        })
      )
    );

    return created({
      message: `Se crearon ${createdPeriods.length} períodos para ${company.name} - ${year}`,
      created: createdPeriods.length,
      skipped: existingMonths.size,
      periods: createdPeriods,
    });
  } catch (err) {
    console.error('Error batch creating periods:', err);
    return serverError('Error al crear períodos en lote');
  }
}
