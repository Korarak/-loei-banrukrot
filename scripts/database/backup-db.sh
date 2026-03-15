#!/bin/bash

# Configuration
BACKUP_DIR="/home/$USER/loei-banrakrod/backups"
CONTAINER_NAME="loei-banrakrod-db"
DB_NAME="banrakrod"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="backup_${DB_NAME}_${TIMESTAMP}.tar.gz"
RETENTION_DAYS=7

# Load environment variables for credentials
if [ -f "/home/$USER/loei-banrakrod/.env" ]; then
    export $(grep -v '^#' /home/$USER/loei-banrakrod/.env | xargs)
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting backup of ${DB_NAME} at $(date)"

# Use docker exec to run mongodump and pipe to a compressed file
# We use root credentials from env if available
MONGO_USER=${MONGO_ROOT_USER:-admin}
MONGO_PASS=${MONGO_ROOT_PASSWORD:-password123}

docker exec "$CONTAINER_NAME" mongodump \
    --username "$MONGO_USER" \
    --password "$MONGO_PASS" \
    --authenticationDatabase admin \
    --db "$DB_NAME" \
    --archive | gzip > "${BACKUP_DIR}/${BACKUP_FILENAME}"

if [ $? -eq 0 ]; then
    echo "Backup successful: ${BACKUP_DIR}/${BACKUP_FILENAME}"
else
    echo "Backup failed!"
    exit 1
fi

# Rotate backups: Delete files older than RETENTION_DAYS
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f -mtime +"$RETENTION_DAYS" -delete

echo "Backup process completed at $(date)"
