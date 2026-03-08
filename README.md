# E-commerce + POS System

Monorepo สำหรับระบบ E-commerce และ POS แบบครบวงจร

## 📁 โครงสร้างโปรเจค

```
.
├── backend/          # REST API (Node.js + Express + MongoDB)
├── frontend/         # Web Application (Coming soon)
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Docker & Docker Compose (optional)

### การรันด้วย Docker

```bash
docker-compose up -d
```

### การรันแบบ Local

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend (Coming soon)
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation

- [Backend API Documentation](./backend/API_DOCUMENTATION.md)
- [Database Schema](./backend/models/README.md)

## 🔧 Environment Variables

สร้างไฟล์ `.env` ใน `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/shopee_db
JWT_SECRET=your_secret_key_here
PORT=3000
```

## 🎯 Features

### Backend (REST API)
- ✅ Authentication (JWT)
- ✅ Product Management
- ✅ Shopping Cart
- ✅ Order Management
- ✅ POS System
- ✅ Inventory Tracking

### Frontend (Coming Soon)
- 🔄 Customer Web App
- 🔄 Admin Dashboard
- 🔄 POS Interface

## 📦 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- express-validator

### Frontend (Planned)
- React / Next.js
- TailwindCSS
- Axios

## 🐳 Docker Services

- **backend**: REST API (Port 3000)
- **mongodb**: Database (Port 27017)
- **frontend**: Web App (Port 3001) - Coming soon

## 📝 API Endpoints

Base URL: `http://localhost:3000/api`

- `/auth` - Authentication
- `/products` - Product management
- `/cart` - Shopping cart
- `/orders` - Order management
- `/pos` - POS operations

## 👥 Team

- Backend Developer: [Your Name]
- Frontend Developer: [Your Name]

## 📄 License

MIT
