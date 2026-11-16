/**
 * ACCESO DESDE LOGIFAST (SSO) — ticket firmado, sin cuentas nuevas.
 *
 * Problema: Ganesha y LogiFast tienen bases distintas. Obligar a cada tienda (y a sus empleados)
 * a crear OTRA cuenta en Ganesha es justo lo que no queremos.
 *
 * Solución: LogiFast firma un *ticket* de vida corta con un secreto compartido y el navegador lo
 * lleva al frontend de Ganesha en el **fragmento** de la URL (`#t=…`), que no viaja al servidor ni
 * queda en logs. Ganesha verifica la firma, crea/actualiza el usuario con ese correo y entrega su
 * token normal. Nada de contraseñas compartidas ni de llamadas públicas: los dos sistemas siguen
 * aislados y se hablan solo con la firma.
 *
 * El ticket es de un solo uso práctico (120 s) y lleva `aud`/`iss` para que no sirva en otro lado.
 */
import crypto from 'crypto';

export interface EmpresaDelTicket {
  companyId: string;
  /** OWNER | ADMIN | ACCOUNTANT | VIEWER (MembershipRole de Ganesha) */
  role: string;
}

export interface TicketLogiFast {
  iss: 'logifast';
  aud: 'ganesha';
  /** Quién entra. Sale del dueño de la sesión de LogiFast, nunca del navegador. */
  sub: string;
  email: string;
  name: string;
  /** 'admin' = administración de LogiFast. 'tienda' = comercio que compró el servicio. */
  tipo: 'admin' | 'tienda';
  /** Rol global en Ganesha: ADMIN | ACCOUNTANT | MANAGER | VIEWER */
  rol: string;
  /** Empresas (tenants) a las que entra, con su rol dentro de cada una. */
  empresas: EmpresaDelTicket[];
  /** Plan contratado, solo informativo/auditoría cuando tipo = 'tienda'. */
  plan?: string | null;
  /** Identificador único del ticket (trazabilidad en los logs). */
  nonce?: string;
  /** Epoch en **segundos**. */
  exp: number;
}

/** Secreto compartido con LogiFast (`LOGIFAST_SSO_SECRET` en los dos lados). */
export function secretoSso(): string | null {
  const secreto = (process.env.LOGIFAST_SSO_SECRET || '').trim();
  return secreto.length >= 16 ? secreto : null;
}

const codificar = (json: string) => Buffer.from(json, 'utf-8').toString('base64url');

function firmar(cuerpo: string, secreto: string): string {
  return crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex');
}

/** Firma un ticket (lo usa LogiFast; aquí queda también para pruebas y para el panel). */
export function emitirTicket(datos: Omit<TicketLogiFast, 'iss' | 'aud' | 'exp'>, segundosVida = 120): string {
  const secreto = secretoSso();
  if (!secreto) throw new Error('Falta LOGIFAST_SSO_SECRET (mínimo 16 caracteres)');

  const payload: TicketLogiFast = {
    ...datos,
    iss: 'logifast',
    aud: 'ganesha',
    exp: Math.floor(Date.now() / 1000) + segundosVida,
  };
  const cuerpo = codificar(JSON.stringify(payload));
  return `${cuerpo}.${firmar(cuerpo, secreto)}`;
}

/** Verifica firma, expiración y audiencia. Devuelve `null` si el ticket no sirve. */
export function verificarTicket(ticket: string): TicketLogiFast | null {
  const secreto = secretoSso();
  if (!secreto || typeof ticket !== 'string' || ticket.length < 20 || ticket.length > 4000) return null;

  const [cuerpo, firma] = ticket.split('.');
  if (!cuerpo || !firma) return null;

  const esperada = Buffer.from(firmar(cuerpo, secreto), 'utf-8');
  const recibida = Buffer.from(firma, 'utf-8');
  if (esperada.length !== recibida.length) return null;
  if (!crypto.timingSafeEqual(esperada, recibida)) return null; // firma inválida / manipulada

  let payload: TicketLogiFast;
  try {
    payload = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  if (payload?.iss !== 'logifast' || payload?.aud !== 'ganesha') return null;
  if (!payload.email || !payload.empresas?.length) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null; // vencido

  return payload;
}

/** Token de sesión de Ganesha con el mismo formato/firma que emite `POST /api/users/login`. */
export function emitirTokenGanesha(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'ganesha_super_secret_123';
  const payload = JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 días
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64');
}
