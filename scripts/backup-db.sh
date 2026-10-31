#!/usr/bin/env sh
#
# Copia de seguridad de PostgreSQL antes de desplegar.
#
# Uso (desde la raíz del repo, en el VPS):
#   sh scripts/backup-db.sh [contenedor] [usuario] [base_de_datos]
#
# Valores por defecto: postgres / username / databasename (los del
# docker-compose.yml). Se pueden sobrescribir con variables de entorno:
#   CONTAINER=postgres DB_USER=nidoria DB_NAME=nidoria sh scripts/backup-db.sh
#
# El dump se guarda comprimido en ./backups (ignorado por git).
set -eu

CONTAINER="${1:-${CONTAINER:-postgres}}"
DB_USER="${2:-${DB_USER:-username}}"
DB_NAME="${3:-${DB_NAME:-databasename}}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/nidoria-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Copia de seguridad de $DB_NAME ($CONTAINER) -> $OUT"

docker exec "$CONTAINER" pg_dump --no-owner --no-privileges -U "$DB_USER" -d "$DB_NAME" | gzip > "$OUT"

if [ ! -s "$OUT" ]; then
    echo "ERROR: la copia de seguridad quedó vacía" >&2
    exit 1
fi

echo "OK: $OUT ($(du -h "$OUT" | cut -f1))"
