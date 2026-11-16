#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  DESPLIEGUE DE GANESHA EN EL SERVIDOR  (donde ya corre LogiFast)
# ═══════════════════════════════════════════════════════════════════════════════
#
#  Uso, en el servidor, desde la carpeta del repo SAAS:
#
#      bash desplegar-ganesha.sh --dry-run     # solo verifica, no cambia nada
#      bash desplegar-ganesha.sh               # despliega de verdad
#
#  Qué hace, en orden:
#    1. Verifica que Docker y los archivos estén.
#    2. Crea (o completa) el `.env` del compose con los secretos, sin pisar lo que ya exista.
#    3. Construye y levanta los dos contenedores (API en 127.0.0.1:3001, panel en 127.0.0.1:3000).
#    4. Espera a que la API responda.
#    5. Respaldа la base (si ya existía) y da de alta el tenant de LogiFast:
#       empresa + usuario robot + administrador + plan de 30 cuentas + períodos abiertos.
#    6. Verifica el acceso y muestra **las variables exactas** que hay que pegar en LogiFast.
#
#  Nada de esto queda expuesto a internet: los puertos se publican solo en loopback.
# ===============================================================================
set -uo pipefail

VERDE='\033[0;32m'; AMARILLO='\033[0;33m'; ROJO='\033[0;31m'; AZUL='\033[0;36m'; FIN='\033[0m'
ok()    { echo -e "${VERDE}✅ $*${FIN}"; }
aviso() { echo -e "${AMARILLO}⚠️  $*${FIN}"; }
error() { echo -e "${ROJO}❌ $*${FIN}"; }
paso()  { echo -e "\n${AZUL}▶ $*${FIN}"; }

MODO="real"
case "${1:-}" in
  --dry-run|--dry) MODO="dry" ;;
  -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
  "") ;;
  *) error "Opción desconocida: $1"; exit 2 ;;
esac

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DIR/.env"
COMPOSE="$DIR/docker-compose.yml"
API="http://127.0.0.1:3001"

echo "═══════════════════════════════════════════════════════════════"
echo "  Ganesha ERP · despliegue en este servidor   ($([ "$MODO" = dry ] && echo 'SIMULACIÓN' || echo 'REAL'))"
echo "  carpeta: $DIR"
echo "═══════════════════════════════════════════════════════════════"

# ── 1. Requisitos ────────────────────────────────────────────────────────────
paso "1/6  Requisitos"
fallos=0
command -v docker >/dev/null || { error "Falta docker"; fallos=1; }
docker compose version >/dev/null 2>&1 || { error "Falta el plugin 'docker compose'"; fallos=1; }
[ -f "$COMPOSE" ] || { error "No encuentro docker-compose.yml en $DIR"; fallos=1; }
[ -f "$DIR/Backend/scripts/ganesha-logifast-setup.js" ] || { error "Falta Backend/scripts/ganesha-logifast-setup.js (¿git pull?)"; fallos=1; }
[ -f "$DIR/Backend/scripts/backup-ganesha-db.js" ] || { error "Falta Backend/scripts/backup-ganesha-db.js (¿git pull?)"; fallos=1; }
[ "$fallos" -eq 0 ] || { error "Corrige lo anterior y vuelve a correrlo."; exit 1; }
ok "docker, compose y scripts presentes"

# ── 2. Variables de entorno ──────────────────────────────────────────────────
paso "2/6  Variables de entorno ($ENV_FILE)"
aleatorio() { openssl rand -hex "${1:-24}" 2>/dev/null || python3 -c "import secrets;print(secrets.token_hex(${1:-24}))"; }

# ¿la IA local está disponible en este servidor?
if curl -s --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  IA="true"; ok "Ollama responde en el servidor → el CFO Virtual quedará activo"
else
  IA="false"; aviso "No hay Ollama en 127.0.0.1:11434 → el CFO Virtual se desactiva (se puede activar después)"
fi

[ -f "$ENV_FILE" ] || { [ "$MODO" = dry ] || : > "$ENV_FILE"; aviso "No existía .env: se creará"; }

poner_si_falta() { # clave valor [comentario]
  local clave="$1" valor="$2" comentario="${3:-}"
  if grep -qE "^${clave}=" "$ENV_FILE" 2>/dev/null; then
    ok "$clave ya estaba definida (no se toca)"
  else
    [ -n "$comentario" ] && echo "# $comentario" >> "$ENV_FILE"
    [ "$MODO" = dry ] || echo "${clave}=${valor}" >> "$ENV_FILE"
    ok "$clave añadida"
  fi
}

poner_si_falta NEXTAUTH_SECRET "$(aleatorio 32)" "Firma de las sesiones del panel de Ganesha"
poner_si_falta LOGIFAST_SSO_SECRET "$(aleatorio 24)" "Secreto compartido con LogiFast (GANESHA_SSO_SECRET debe ser el MISMO)"
poner_si_falta FRONTEND_URL "http://localhost:3000" "URL que usa el navegador para abrir el panel (túnel SSH o subdominio)"
poner_si_falta OLLAMA_URL "http://host.docker.internal:11434" "Ollama del host vista desde el contenedor"
poner_si_falta OLLAMA_MODEL "qwen2.5:7b" "Modelo del CFO Virtual"
poner_si_falta AI_ENABLED "$IA" "Activa el chat del CFO"

if [ "$MODO" = real ]; then
  chmod 600 "$ENV_FILE" 2>/dev/null || true
fi

# ── 3. Construir y levantar ─────────────────────────────────────────────────
paso "3/6  Contenedores"
if [ "$MODO" = dry ]; then
  aviso "[simulación] docker compose up -d --build"
else
  docker compose -f "$COMPOSE" up -d --build || { error "'docker compose up' falló"; exit 1; }
  ok "contenedores arriba (API 127.0.0.1:3001 · panel 127.0.0.1:3000)"
fi

# ── 4. Esperar la API ───────────────────────────────────────────────────────
paso "4/6  Esperando a la API"
if [ "$MODO" = dry ]; then
  aviso "[simulación] esperaría respuesta en $API/api/companies"
else
  listo=0
  for i in $(seq 1 60); do
    codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$API/api/companies" 2>/dev/null || echo 000)
    if [ "$codigo" != "000" ]; then listo=1; break; fi
    sleep 2
  done
  [ "$listo" = 1 ] && ok "la API responde (HTTP $codigo)" || { error "La API no respondió en 2 minutos. Revisa: docker compose logs ganesha-backend"; exit 1; }
fi

# ── 5. Respaldo + alta del tenant ───────────────────────────────────────────
paso "5/6  Respaldo y alta del tenant de LogiFast"
if [ "$MODO" = dry ]; then
  aviso "[simulación] docker compose exec -T ganesha-backend node scripts/backup-ganesha-db.js"
  aviso "[simulación] docker compose exec -T ganesha-backend node scripts/ganesha-logifast-setup.js"
  SALIDA_SETUP=""
else
  if docker compose -f "$COMPOSE" exec -T ganesha-backend node scripts/backup-ganesha-db.js 2>/dev/null; then
    ok "respaldo previo hecho"
  else
    aviso "No había base que respaldar (primera instalación) — seguimos"
  fi

  SALIDA_SETUP=$(docker compose -f "$COMPOSE" exec -T ganesha-backend node scripts/ganesha-logifast-setup.js 2>&1)
  if echo "$SALIDA_SETUP" | grep -q "GANESHA_PASSWORD="; then
    ok "tenant creado/actualizado"
    echo "$SALIDA_SETUP" | sed -n '/────────────────/,$p'
  else
    error "El alta del tenant falló:"
    echo "$SALIDA_SETUP"
    exit 1
  fi
fi

# ── 6. Verificación + lo que hay que pegar en LogiFast ──────────────────────
paso "6/6  Verificación"
if [ "$MODO" = dry ]; then
  aviso "[simulación] comprobaría el SSO y el login del robot"
else
  est=$(curl -s --max-time 10 "$API/api/auth/sso/sesion?json=1" 2>/dev/null)
  echo "$est" | grep -q '"configurado":true' && ok "SSO configurado" || aviso "El SSO aún no está configurado: $est"

  EMAIL_ROBOT=$(echo "$SALIDA_SETUP" | grep -oP '^GANESHA_EMAIL=\K.*' || true)
  PASS_ROBOT=$(echo "$SALIDA_SETUP" | grep -oP '^GANESHA_PASSWORD=\K.*' || true)
  if [ -n "${EMAIL_ROBOT:-}" ] && [ -n "${PASS_ROBOT:-}" ]; then
    cod=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -X POST "$API/api/users/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$EMAIL_ROBOT\",\"password\":\"$PASS_ROBOT\"}" || echo 000)
    [ "$cod" = "200" ] && ok "el usuario robot puede entrar por la API" || error "el robot NO pudo entrar (HTTP $cod)"
  fi
fi

echo
echo "═══════════════════════════════════════════════════════════════"
echo "  PEGAR EN EL ENTORNO DE LOGIFAST (y reiniciar backend + realtime)"
echo "═══════════════════════════════════════════════════════════════"
if [ "$MODO" = dry ]; then
  echo "GANESHA_API_URL=http://localhost:3001"
  echo "GANESHA_EMAIL=<lo imprime el setup>"
  echo "GANESHA_PASSWORD=<lo imprime el setup>"
  echo "GANESHA_COMPANY_ID=<lo imprime el setup>"
  echo "GANESHA_SSO_SECRET=<el LOGIFAST_SSO_SECRET de $ENV_FILE>"
  echo "GANESHA_FRONTEND_URL=$([ -f "$ENV_FILE" ] && grep -oP '^FRONTEND_URL=\K.*' "$ENV_FILE" || echo http://localhost:3000)"
else
  echo "$SALIDA_SETUP" | grep -E '^(GANESHA_API_URL|GANESHA_EMAIL|GANESHA_PASSWORD|GANESHA_COMPANY_ID)='
  echo "GANESHA_SSO_SECRET=$(grep -oP '^LOGIFAST_SSO_SECRET=\K.*' "$ENV_FILE")"
  echo "GANESHA_FRONTEND_URL=$(grep -oP '^FRONTEND_URL=\K.*' "$ENV_FILE")"
fi
echo "═══════════════════════════════════════════════════════════════"
cat <<'FIN_AYUDA'

PARA ENTRAR AL PANEL desde tu computadora (sin exponer nada a internet):
    ssh -N -L 3000:127.0.0.1:3000 usuario@servidor
  y abrí http://localhost:3000   (el admin y su contraseña los imprimió el setup)

RESPALDO DIARIO (recomendado, la contabilidad vive en un SQLite):
    crontab -e   y agregá:
    0 2 * * * cd RUTA_DEL_REPO/SAAS && docker compose exec -T ganesha-backend \
              node scripts/backup-ganesha-db.js >> /var/log/ganesha-backup.log 2>&1

SI LOGIFAST NO ESTÁ EN ESTE SERVIDOR:
  no cambies el bind a 0.0.0.0; usá una red privada (WireGuard/Tailscale) o un túnel SSH.
FIN_AYUDA
