#!/bin/bash

# Configuration
CONTAINER_NAME="loei-banrakrod-db"
DB_NAME="banrakrod"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.tar.gz>"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File $BACKUP_FILE not found!"
    exit 1
fi

# Load environment variables for credentials
if [ -f "/home/$USER/loei-banrakrod/.env" ]; then
    export $(grep -v '^#' /home/$USER/loei-banrakrod/.env | xargs)
fi

MONGO_USER=${MONGO_ROOT_USER:-admin}
MONGO_PASS=${MONGO_ROOT_PASSWORD:-password123}

echo "Warning: This will overwrite the current '${DB_NAME}' database!"
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

echo "Starting restoration from ${BACKUP_FILE}..."

# Decompress and restore in one pipe
gunzip < "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" mongorestore \
    --username "$MONGO_USER" \
    --password "$MONGO_PASS" \
    --authenticationDatabase admin \
    --archive \
    --drop

if [ $? -eq 0 ]; then
    echo "Restoration successful!"
else
    echo "Restoration failed!"
    exit 1
fi
