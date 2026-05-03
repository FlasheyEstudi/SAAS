import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, phone, password } = body;
    const email = body.email.toLowerCase().trim();

    // 1. Validaciones básicas
    if (!name || !email || !company || !password) {
      return error('Todos los campos son obligatorios');
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await db.user.findFirst({ where: { email } });
    if (existingUser) {
      return error('El correo electrónico ya está en uso');
    }

    // 3. Verificar si la empresa ya existe (opcional, por el momento crearemos una nueva con ese nombre, pero garantizando el unique en catch o comprobando antes)
    let existingCompany = await db.company.findFirst({ where: { name: company } });
    
    // Si queremos crear a cada usuario un Tenant (compañía), idealmente usamos transacciones
    const result = await db.$transaction(async (tx) => {
      let companyRecord = existingCompany;
      if (!companyRecord) {
        // En una app real de SAAS pedirías el taxId/RFC además del company name, por ahora es un dummy placeholder
        companyRecord = await tx.company.create({
          data: {
            name: company,
            taxId: 'PENDIENTE',
            phone: phone || '',
            email: email,
          },
        });
      }

      // Hash the password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create the user
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          companyId: companyRecord.id,
          role: 'ADMIN', // El que crea la empresa es ADMIN en el campo global (por ahora compatible)
          isActive: true
        },
      });

      // 4. Crear el vínculo de membresía explícito
      await tx.userCompany.create({
        data: {
          userId: newUser.id,
          companyId: companyRecord.id,
          role: 'OWNER',
        }
      });

      // 5. Crear Período Contable Inicial por defecto (Mes actual)
      const now = new Date();
      await tx.accountingPeriod.create({
        data: {
          companyId: companyRecord.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          status: 'OPEN',
        }
      });

      return { companyRecord, newUser };
    });

    // 4. Retornar éxito
    return success({
      message: 'Usuario registrado exitosamente',
      user: {
        id: result.newUser.id,
        name: result.newUser.name,
        email: result.newUser.email,
        companyId: result.newUser.companyId,
        availableCompanies: [{
          id: result.companyRecord.id,
          name: result.companyRecord.name,
          role: 'OWNER'
        }]
      }
    });
  } catch (err) {
    console.error('Error registrando usuario:', err);
    return serverError('Hubo un error al registrar el usuario');
  }
}
