# Disaster Recovery & Migration Guide

This guide explains how to recover your shop or migrate it to a new server in various scenarios.

## Prerequisites
- Access to your **GitHub Repositories** (Private).
- Access to your **Private Docker Registry**.
- Linux Server with **Docker** and **Docker Compose** installed.
- Your `.env` file credentials.
- The real VPS host/user/SSH key and all secret values live in `deploy-secrets.local.md` (gitignored, not in this repo's history) — this guide only uses placeholders like `<OLD_VPS_IP>` / `<NEW_VPS_IP>`.

---

## Scenario A: Migrating to a New Server
*Use this when changing hosting providers or moving to more powerful hardware.*

### 1. Log in to the old server and take a backup
```bash
ssh <deploy_user>@<OLD_VPS_IP>
```
Then either:
- **Via Admin panel** (easiest): go to **Admin > สำรองข้อมูล**, click "สำรองข้อมูลเดี๋ยวนี้ (Backup Now)", download the resulting `.tar.gz`, then click "ดาวน์โหลดไฟล์อัปโหลด (ZIP)" to get the `uploads` directory. Both land on your own PC — skip straight to step 3.
- **Via SSH**, if you're already on the box:
  ```bash
  bash ~/loei-banrakrod/scripts/database/backup-db.sh
  # -> writes ~/loei-banrakrod/backups/backup_banrakrod_<timestamp>.tar.gz
  cd ~/loei-banrakrod && zip -r ~/uploads_backup.zip backend/public/uploads
  ```

### 2. Copy the two files off the old server (skip if you used the Admin panel)
From your own PC:
```bash
scp <deploy_user>@<OLD_VPS_IP>:~/loei-banrakrod/backups/backup_banrakrod_<timestamp>.tar.gz .
scp <deploy_user>@<OLD_VPS_IP>:~/uploads_backup.zip .
```

### 3. Set up the new server and deploy the stack
- SSH into the new server: `ssh <deploy_user>@<NEW_VPS_IP>`
- Follow **[DEPLOYMENT.md](file:///d:/@loei-banrakrod/DEPLOYMENT.md)** to clone the repo, set up `.env`, and bring up the containers with `docker compose up -d` — do this *before* restoring so the `mongodb` container (and the named `mongodb_data` volume) already exists.
- Confirm all containers are healthy: `docker compose ps`

### 4. Upload the backup files to the new server
From your own PC (or straight from the old server via `scp` to the new one):
```bash
scp backup_banrakrod_<timestamp>.tar.gz <deploy_user>@<NEW_VPS_IP>:~/loei-banrakrod/backups/
scp uploads_backup.zip <deploy_user>@<NEW_VPS_IP>:~/
```

### 5. Restore data on the new server
SSH into the new server, then:
```bash
sudo bash ~/loei-banrakrod/scripts/database/restore-db.sh ~/loei-banrakrod/backups/backup_banrakrod_<timestamp>.tar.gz
bash ~/loei-banrakrod/scripts/database/restore-uploads.sh ~/uploads_backup.zip
```
Each script asks for a `y/n` confirmation before it overwrites anything.

### 6. Point everything at the new server
- **DNS**: update your domain's A record to `<NEW_VPS_IP>`.
- **Nginx Proxy Manager**: reconfigure proxy hosts + re-issue Let's Encrypt certs on the new server (NPM's data isn't part of this backup — it's config you recreate, see `deploy-secrets.local.md` for the previous setup as reference).
- **GitHub Actions secrets** (Settings > Secrets and variables > Actions): update `SERVER_SSH_HOST` (and `SERVER_SSH_USERNAME`/`SERVER_SSH_KEY` if they changed) to the new VPS, otherwise the next push to `main` deploys to the *old* server.
- Smoke-test the site, then decommission the old VPS.

---

## Scenario B: Hardware / Hard Drive Failure
*Use this when your server's disk dies and you've lost local files.*

1.  **Acquire New Hardware**: Setup a fresh Linux install.
2.  **External Backups**: (Crucial) Ideally, you should have been periodically downloading the backups from the Admin Panel or via SFTP to a safe location (e.g., your PC or Cloud Drive).
3.  **Fresh Install**:
    - Follow **[DEPLOYMENT.md](file:///d:/@loei-banrakrod/DEPLOYMENT.md)** to redeploy the stack.
4.  **Recovery**:
    - Upload your safest external backups (`.tar.gz` and `.zip`) to the server.
    - Run `restore-db.sh` and `restore-uploads.sh` as described in Scenario A.

---

## Scenario C: Accidental Data Deletion
*Use this when someone accidentally deletes products, orders, or categories from the Admin Panel.*

1.  **Identify the latest healthy backup**: Go to **Admin > สำรองข้อมูล** to see the list of available files.
2.  **SSH to Server**: Login via terminal.
3.  **Run Restore**:
    ```bash
    sudo bash ~/loei-banrakrod/scripts/database/restore-db.sh ~/loei-banrakrod/backups/backup_banrakrod_YYYYMMDD_HHMMSS.tar.gz
    ```
    *Warning: This will roll back the entire database to that point in time.*

---

## Important Contact
If you encounter issues during a critical recovery, contact your system administrator or the developer.
