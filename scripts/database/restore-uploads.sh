#!/bin/bash

# Configuration
UPLOADS_DIR="$(cd "$(dirname "$0")/../.." && pwd)/backend/public/uploads"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_uploads_backup.zip>"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File $BACKUP_FILE not found!"
    exit 1
fi

mkdir -p "$UPLOADS_DIR"

echo "Warning: This will overwrite files in '${UPLOADS_DIR}'!"
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

echo "Starting restoration from ${BACKUP_FILE}..."

unzip -o "$BACKUP_FILE" -d "$UPLOADS_DIR"

if [ $? -eq 0 ]; then
    echo "Restoration successful!"
else
    echo "Restoration failed!"
    exit 1
fi
