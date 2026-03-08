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

## 2. Portainer Deployment (Initial Setup)
1. Go to **Registries** and add your Private Registry (`docker5.loeitech.org:5000`) with authentication.
2. Go to **Stacks** -> **Add stack**.
3. Give it a name (e.g., `banrakrod-stack`).
4. Paste the content of `docker-compose.yml`.
5. Add the **Environment variables** listed above.
6. Enable **Webhooks** for both the `frontend` and `backend` services.
7. Click **Deploy the stack**.
8. Copy the Webhook URLs and configure them as GitHub Actions Secrets (`PORTAINER_WEBHOOK_URL_FRONTEND` and `PORTAINER_WEBHOOK_URL_BACKEND`).

## 3. Port Mappings
- **Frontend**: Port `8081`
- **Backend**: Port `8080`
- **MongoDB**: Port `27017` (Internal only, or exposed if needed)

## 4. Persistent Volumes
The stack uses a named volume `mongodb_data` for database persistence and a bind mount for backend uploads. Ensure the directory `./backend/public/uploads` exists on your host if using bind mounts, or adjust to named volumes for full container portability.
