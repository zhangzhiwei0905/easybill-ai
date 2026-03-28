#!/bin/bash
# EasyBill AI PostgreSQL Backup Script
# Usage: ./scripts/backup-db.sh
# Setup cron for daily backup: 0 2 * * * /opt/easybill-ai/scripts/backup-db.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/easybill_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

cd "$PROJECT_DIR"

docker compose exec -T postgres pg_dump -U easybill easybill | gzip > "$BACKUP_FILE"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/easybill_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --

echo "[$(date)] Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
