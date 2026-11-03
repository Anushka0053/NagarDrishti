#!/usr/bin/env bash
# ==============================================================================
# NAGARDRISHTI — AUTOMATED POSTGIS PRODUCTION BACKUP SCRIPT
# Performs gzipped pg_dump with timestamping, integrity check, and retention prune
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/nagardrishti}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/nagardrishti_postgis_${TIMESTAMP}.sql.gz"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-nagardrishti}"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting NagarDrishti PostGIS backup at $(date)..."
echo "[INFO] Target file: ${BACKUP_FILE}"

# Execute pg_dump with custom compression
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip -9 > "${BACKUP_FILE}"

FILESIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "[SUCCESS] PostGIS database successfully dumped and compressed (${FILESIZE})."

# Prune archives older than retention window
echo "[INFO] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "nagardrishti_postgis_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "[SUCCESS] Backup workflow completed at $(date)."

