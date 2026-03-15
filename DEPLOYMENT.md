# Deployment Guide (Portainer / Docker Compose)

## 1. Environment Configuration
Create a `.env` file in the project root (or add these to Portainer Environment Variables):

```env
# Database
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_password

# Backend
JWT_SECRET=your_super_secret_key
MONGODB_URI=mongodb://admin:your_secure_password@mongodb:27017/banrakrod?authSource=admin

# No Frontend vars needed in Production .env here since they are baked into the image at build time via GitHub Actions.
```

## 2. Server Deployment Setup (For GitHub Actions)
To allow GitHub Actions to deploy automatically via SSH:

1. SSH into your server: `ssh -p 223 adm1n_ltc@202.29.231.188`
2. Create the deployment directory: `mkdir -p ~/loei-banrakrod`
3. Copy your `docker-compose.yml` and `.env` files into `~/loei-banrakrod`.
4. Your GitHub Actions pipeline will automatically log into the server via SSH, pull the latest images from your registry, and run `docker compose up -d` in that directory.

## 3. Port Mappings
- **Frontend**: Port `8081`
- **Backend**: Port `8080`
- **MongoDB**: Port `27017` (Internal only, or exposed if needed)

## 4. Persistent Volumes
The stack uses a named volume `mongodb_data` for database persistence and a bind mount for backend uploads. Ensure the directory `./backend/public/uploads` exists on your host if using bind mounts, or adjust to named volumes for full container portability.

## 5. Backup and Recovery

### Automated Backup
A script is provided in `./scripts/database/backup-db.sh` to automate backups.

1.  **Setup local backups on server**:
    ```bash
    mkdir -p ~/loei-banrakrod/scripts
    cp ./scripts/database/backup-db.sh ~/loei-banrakrod/scripts/
    chmod +x ~/loei-banrakrod/scripts/backup-db.sh
    ```

2.  **Add to Cron (Daily at 3 AM)**:
    ```bash
    crontab -e
    # Add this line:
    0 3 * * * /home/adm1n_ltc/loei-banrakrod/scripts/backup-db.sh >> /home/adm1n_ltc/loei-banrakrod/backups/backup.log 2>&1
    ```

### Manual Backup
```bash
~/loei-banrakrod/scripts/backup-db.sh
```

### Database Restoration
A restoration script is provided in `./scripts/database/restore-db.sh`.

1.  **Manual Restoration**:
    ```bash
    ~/loei-banrakrod/scripts/restore-db.sh ~/loei-banrakrod/backups/backup_banrakrod_20240315_120000.tar.gz
    ```
    *Note: The script will ask for confirmation before overwriting the current database.*

If you prefer to run it manually without the script:
```bash
gunzip < ~/loei-banrakrod/backups/backup_banrakrod_TIMESTAMP.tar.gz | docker exec -i loei-banrakrod-db mongorestore --username admin --password your_password --authenticationDatabase admin --archive --drop
```
