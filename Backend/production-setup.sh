#!/bin/bash
# Script de preparación para producción FINAL - Ganesha ERP

echo "🚀 Iniciando preparación de producción para el Backend..."

# 1. Instalar dependencias
npm install --production=false

# 2. Generar cliente de Prisma
echo "📦 Generando cliente de Prisma..."
npx prisma generate

# 3. Detectar nombre de la base de datos desde el schema
DB_NAME=$(grep "url" prisma/schema.prisma | cut -d'/' -f2 | tr -d '"')
if [ -z "$DB_NAME" ]; then DB_NAME="dev.db"; fi

# 4. Actualizar base de datos
echo "🗄️ Actualizando esquema de base de datos ($DB_NAME)..."
npx prisma db push

# 5. Optimizar SQLite (Modo WAL)
echo "⚡ Optimizando SQLite (Modo WAL)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.\$queryRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.\$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
    console.log('✅ SQLite optimizado: journal_mode=WAL');
  } catch (e) {
    console.error('❌ Error optimizando SQLite:', e.message);
  }
}
main().catch(console.error).finally(() => prisma.\$disconnect());
"

# 6. Build del proyecto
echo "🏗️ Construyendo aplicación para producción..."
npm run build

# 7. Asegurar que la DB esté accesible para el modo standalone
cp "$DB_NAME" .next/standalone/ 2>/dev/null || true

echo "✅ Preparación completada."
echo "👉 Para iniciar el Backend sin errores de base de datos, ejecuta:"
echo "   DATABASE_URL=\"file:$(pwd)/$DB_NAME\" PORT=3001 npm start"
