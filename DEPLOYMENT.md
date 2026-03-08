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
