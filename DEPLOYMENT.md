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

1. SSH into your server (see `deploy-secrets.local.md` for the actual host/user)
2. Create the deployment directory: `mkdir -p ~/loei-banrakrod`
3. Copy your `docker-compose.yml` and `.env` files into `~/loei-banrakrod`.
4. Your GitHub Actions pipeline will automatically log into the server via SSH, pull the latest images from your registry, and run `docker compose up -d` in that directory.

## 3. Port Mappings
- **Frontend**: Port `8081`
- **Backend**: Port `8080`
- **MongoDB**: Port `27017` (Internal only, or exposed if needed)

## 4. Persistent Volumes
The stack uses a named volume `mongodb_data` for database persistence and a **Bind Mount** for backend uploads. 

Ensure the volume mapping in `docker-compose.yml` is exactly as follows to avoid data loss:
`- ./backend/public/uploads:/app/backend/public/uploads`

> [!WARNING]
> If you are using a CI/CD system (like Portainer Git Stacks) that re-clones the repository on each update, the files in `./backend/public/uploads` will be wiped unless they are stored in an absolute path outside the repository directory.

## 5. Backup and Recovery

This project intentionally keeps backups **manual** — no cron, no off-site automation. See **[DISASTER_RECOVERY.md](file:///d:/@loei-banrakrod/DISASTER_RECOVERY.md)** for the full runbook (migration, hardware failure, accidental deletion). Quick reference:

### Manual Backup
Trigger from **Admin > สำรองข้อมูล** (downloads both the DB `.tar.gz` and an uploads `.zip`), or via SSH:
```bash
bash ~/loei-banrakrod/scripts/database/backup-db.sh
```

### Manual Restoration
```bash
sudo bash ~/loei-banrakrod/scripts/database/restore-db.sh ~/loei-banrakrod/backups/backup_banrakrod_20240315_120000.tar.gz
bash ~/loei-banrakrod/scripts/database/restore-uploads.sh ~/loei-banrakrod/uploads_backup.zip
```
Both scripts ask for confirmation before overwriting anything.

## 6. Professional Deployment & Cleanup

To maintain a clean server and ensure consistent deployments, it is recommended to use an automated script instead of manual commands.

### The Professional Way: `deploy.sh`
We have provided a `deploy.sh` script in the project root. This script automates:
1. **Pulling** latest images from the registry.
2. **Updating** containers without downtime.
3. **Cleaning up** dangling (old) images automatically.
4. **Health checking** the services.

**How to use:**
```bash
# First time setup
chmod +x ./deploy.sh

# To deploy a new version
./deploy.sh
```

### Why this is "Professional":
- **Automation**: Reduces human error by running a consistent set of commands.
- **Dangling Image Cleanup**: Uses `docker image prune -f` right after deployment to save disk space.
- **Feedback**: Provides colored status messages to let you know what's happening.
- **Zero-Downtime**: `docker compose up -d` handles the container recreation smoothly.

### Monitoring Tip:
You can use `docker stats` to monitor resource usage in real-time, or check Portainer's dashboard for a high-level overview. Always keep an eye on **Disk Usage** if you have many large images.

