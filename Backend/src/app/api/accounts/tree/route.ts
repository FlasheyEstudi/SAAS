import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const user = await validateAuth(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || user.companyId;

    if (!companyId) return NextResponse.json({ error: 'Falta companyId' }, { status: 400 });

    // 1. Obtener todas las cuentas de la empresa
    const accounts = await db.account.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });

    // 2. Construir el árbol
    const buildTree = (parentId: string | null = null): any[] => {
      return accounts
        .filter(account => account.parentId === parentId)
        .map(account => ({
          ...account,
          children: buildTree(account.id),
        }));
    };

    const accountTree = buildTree(null);

    return NextResponse.json({
      data: accountTree,
      total: accounts.length,
    });
  } catch (error) {
    console.error('Error fetching account tree:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
