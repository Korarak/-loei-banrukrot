# Backend Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Remove package-lock.json to avoid private registry errors (verdacio.vecskill.ovec)
RUN rm -rf package-lock.json && npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "start"]
