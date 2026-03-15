# Disaster Recovery & Migration Guide

This guide explains how to recover your shop or migrate it to a new server in various scenarios.

## Prerequisites
- Access to your **GitHub Repositories** (Private).
- Access to your **Private Docker Registry**.
- Linux Server with **Docker** and **Docker Compose** installed.
- Your `.env` file credentials.

---

## Scenario A: Migrating to a New Server
*Use this when changing hosting providers or moving to more powerful hardware.*

1.  **Backup Data on Old Server**:
    - Run `~/loei-banrakrod/scripts/backup-db.sh`
    - Download the latest `.tar.gz` from `~/loei-banrakrod/backups/`
    - Compress and download the `~/loei-banrakrod/backend/public/uploads` directory.

2.  **Prepare New Server**:
    - SSH into the new server.
    - Create the directory: `mkdir -p ~/loei-banrakrod/backups`
    - Upload the backup files and the `uploads` folder to the new server.

3.  **Deploy System**:
    - Follow the **[DEPLOYMENT.md](file:///d:/@loei-banrakrod/DEPLOYMENT.md)** to clone and start the Docker containers.

4.  **Restore Data**:
    - Run the restoration script:
      ```bash
      sudo bash ~/loei-banrakrod/scripts/restore-db.sh ~/loei-banrakrod/backups/your_backup_file.tar.gz
      ```
    - Move your uploaded images back to `~/loei-banrakrod/backend/public/uploads`.

---

## Scenario B: Hardware / Hard Drive Failure
*Use this when your server's disk dies and you've lost local files.*

1.  **Acquire New Hardware**: Setup a fresh Linux install.
2.  **External Backups**: (Crucial) Ideally, you should have been periodically downloading the backups from the Admin Panel or via SFTP to a safe location (e.g., your PC or Cloud Drive).
3.  **Fresh Install**:
    - Follow **[DEPLOYMENT.md](file:///d:/@loei-banrakrod/DEPLOYMENT.md)** to redeploy the stack.
4.  **Recovery**:
    - Upload your safest external backup to the server.
    - Run `restore-db.sh` as described in Scenario A.

---

## Scenario C: Accidental Data Deletion
*Use this when someone accidentally deletes products, orders, or categories from the Admin Panel.*

1.  **Identify the latest healthy backup**: Go to **Admin > สำรองข้อมูล** to see the list of available files.
2.  **SSH to Server**: Login via terminal.
3.  **Run Restore**:
    ```bash
    ~/loei-banrakrod/scripts/restore-db.sh ~/loei-banrakrod/backups/backup_banrakrod_YYYYMMDD_HHMMSS.tar.gz
    ```
    *Warning: This will roll back the entire database to that point in time.*

---

## Important Contact
If you encounter issues during a critical recovery, contact your system administrator or the developer.
