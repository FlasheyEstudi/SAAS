#!/usr/bin/env node
/**
 * RESPALDO DE LA BASE DE GANESHA (SQLite)  ·  ejecutable con:
 *
 *   DATABASE_URL=file:./prisma/dev.db node scripts/backup-ganesha-db.js [destino]
 *
 * Por qué existe: la contabilidad de LogiFast vive en un único archivo SQLite dentro de un volumen
 * Docker. Una póliza publicada es inmutable y no se puede rehacer; si ese archivo se pierde, se
 * pierde el histórico contable completo. Este script hace una copia consistente y rota los
 * respaldos viejos.
 *
 * Cómo lo hace bien (no es un `cp`):
 *   1. `PRAGMA wal_checkpoint(TRUNCATE)` vuelca el WAL al archivo principal. Copiar sin esto deja
 *      fuera las últimas transacciones (justo las de hoy).
 *   2. Copia el archivo con `fs.copyFileSync`, que es lo único que ve el proceso sin bloquear la app.
 *
 * Uso típico en el servidor (cron diario a las 2:00):
 *   0 2 * * * docker compose exec -T ganesha-backend node scripts/backup-ganesha-db.js >> /var/log/ganesha-backup.log 2>&1
 *
 * El destino por defecto es `./backups/` (dentro del contenedor: hay que mapearlo a un volumen o a
 * una carpeta del host, si no el respaldo muere con el contenedor).
 * Se conservan los últimos `GANESHA_BACKUPS_KEEP` (14 por defecto).
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const KEEP = Math.max(1, parseInt(process.env.GANESHA_BACKUPS_KEEP || '14', 10));
const destinoDir = path.resolve(process.argv[2] || process.env.GANESHA_BACKUP_DIR || './backups');

function rutaDelArchivo() {
  const url = process.env.DATABASE_URL || '';
  if (!url.startsWith('file:')) {
    throw new Error(`DATABASE_URL no apunta a un archivo SQLite (es: ${url.slice(0, 30)}…)`);
  }
  const relativa = url.replace(/^file:/, '');
  // Prisma resuelve `file:./x` relativo a prisma/ (donde vive schema.prisma)
  return path.isAbsolute(relativa) ? relativa : path.resolve(__dirname, '..', 'prisma', relativa);
}

async function principal() {
  const origen = rutaDelArchivo();
  if (!fs.existsSync(origen)) throw new Error(`No existe la base en ${origen}`);

  const marca = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23); // con milisegundos: dos respaldos seguidos no se pisan
  const destino = path.join(destinoDir, `ganesha-${marca}.db`);

  const db = new PrismaClient();
  try {
    // 1. Bajar el WAL al archivo principal (si el modo WAL está activo, esto es lo que faltaría)
    // `queryRaw` y no `executeRaw`: el PRAGMA devuelve filas y SQLite no admite execute con resultados.
    await db.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');
  } catch (err) {
    console.warn('⚠️  No se pudo hacer checkpoint del WAL:', err?.message || err);
  } finally {
    await db.$disconnect().catch(() => null);
  }

  // 2. Copiar y verificar tamaño
  fs.mkdirSync(destinoDir, { recursive: true });
  fs.copyFileSync(origen, destino);
  const tam = fs.statSync(destino).size;
  if (tam === 0) throw new Error('El respaldo salió vacío');
  console.log(`✅ Respaldo: ${destino} (${(tam / 1024 / 1024).toFixed(2)} MB)`);

  // 3. Rotación: se quedan los últimos KEEP
  const archivos = fs
    .readdirSync(destinoDir)
    .filter((f) => f.startsWith('ganesha-') && f.endsWith('.db'))
    .sort()
    .reverse();
  for (const viejo of archivos.slice(KEEP)) {
    fs.unlinkSync(path.join(destinoDir, viejo));
    console.log(`🗑️  Respaldo viejo borrado: ${viejo}`);
  }
  console.log(`ℹ️  Respaldos conservados: ${Math.min(archivos.length, KEEP)} de ${archivos.length}`);
}

principal().catch((err) => {
  console.error('❌ Error en el respaldo:', err?.message || err);
  process.exitCode = 1;
});
