# Production Deployment & Operations Guide (`DEPLOYMENT.md`)

This document provides a step-by-step operational guide for deploying, configuring, scaling, and maintaining the Joel Talargie Academy LMS in production environments. It covers **Hostinger VPS / Ubuntu Linux**, **PM2 Process Management**, **Nginx Reverse Proxy**, **SSL Let's Encrypt**, **Vercel**, **Render**, and **Neon PostgreSQL**.

---

## Table of Contents

- [1. Deployment Architecture Summary](#1-deployment-architecture-summary)
- [2. Environment Variable Configuration](#2-environment-variable-configuration)
- [3. Hostinger VPS / Ubuntu Deployment Guide](#3-hostinger-vps--ubuntu-deployment-guide)
- [4. Nginx Reverse Proxy & SSL Setup](#4-nginx-reverse-proxy--ssl-setup)
- [5. PM2 Process Management](#5-pm2-process-management)
- [6. Vercel & Render Alternative Setup](#6-vercel--render-alternative-setup)
- [7. Production Verification & Monitoring](#7-production-verification--monitoring)
- [8. Backup & Maintenance Procedures](#8-backup--maintenance-procedures)

---

## 1. Deployment Architecture Summary

In production, the application operates as two server processes alongside background worker tasks and a Neon PostgreSQL database instance:

```mermaid
graph TD
    Client["User Web Browser"]
    Nginx["Nginx Reverse Proxy (Port 80/443 SSL)"]
    NextServer["Next.js Web Server (PM2 - Port 3000)"]
    NestAPI["NestJS REST API Server (PM2 - Port 4000)"]
    Workers["Background Workers (Certificates & Email)"]
    NeonDB[("Neon PostgreSQL Database")]
    Storage["Storage (Local Disk / S3)"]

    Client -->|HTTPS: yourdomain.com| Nginx
    Client -->|HTTPS: api.yourdomain.com| Nginx
    Nginx -->|Proxy Pass http://127.0.0.1:3000| NextServer
    Nginx -->|Proxy Pass http://127.0.0.1:4000| NestAPI
    NextServer -->|Server Calls| NestAPI
    NestAPI -->|Drizzle Connection Pool| NeonDB
    NestAPI -->|Read / Write Assets| Storage
    Workers -->|Poll Pending Jobs| NeonDB
```

---

## 2. Environment Variable Configuration

Create `.env.production` on your server by copying and populating production credentials:

```env
# ==========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ==========================================
NODE_ENV=production
WEB_PORT=3000
API_PORT=4000

# 1. DOMAINS & URLS
WEB_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
INTERNAL_API_URL=http://localhost:4000/api/v1
CORS_ADDITIONAL_ORIGINS=https://yourdomain.com
TRUST_PROXY=true

# 2. SECURITY SECRETS (Generate min 32-character random strings)
JWT_ACCESS_SECRET=secure-production-jwt-access-secret-32-chars
JWT_REFRESH_SECRET=secure-production-jwt-refresh-secret-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
AUTH_COOKIE_SECURE=true
BCRYPT_SALT_ROUNDS=12

# 3. DATABASE CONFIGURATION (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_zcaEB2MAopZ9@ep-delicate-bonus-axs29wmt-pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full
DATABASE_DIRECT_URL=postgresql://neondb_owner:npg_zcaEB2MAopZ9@ep-delicate-bonus-axs29wmt.us-east-2.aws.neon.tech/neondb?sslmode=verify-full
DATABASE_POOL_MAX=10

# 4. EMAIL / SMTP CONFIGURATION
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=digitalconstructinternal@gmail.com
SMTP_PASSWORD=ncll yjik tind gbba
SMTP_FROM_NAME=Joel Talargie Academy
SMTP_FROM_EMAIL=digitalconstructinternal@gmail.com
MAIL_ENABLED=true

# 5. STORAGE DRIVER
STORAGE_DRIVER=local
STORAGE_SIGNING_SECRET=secure-storage-signing-secret-32-chars
STORAGE_SIGNED_URL_TTL_SECONDS=900
```

---

## 3. Hostinger VPS / Ubuntu Deployment Guide

### Step 1: System Preparation
On your Hostinger VPS (Ubuntu 22.04 / 24.04 LTS):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 2: Clone and Install
```bash
cd /var/www
sudo git clone <repository-url> joel-academy
cd joel-academy
sudo chown -R $USER:$USER /var/www/joel-academy
npm install
```

### Step 3: Run Database Migrations
```bash
npm run db:migrate
npm run db:seed
```

### Step 4: Build Production Assets
```bash
npm run build
```

---

## 4. Nginx Reverse Proxy & SSL Setup

### Step 1: Create Nginx Site Configuration
Create `/etc/nginx/sites-available/joelacademy`:
```nginx
# 1. Frontend Web App Proxy
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Backend API Server Proxy
server {
    server_name api.yourdomain.com;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 2: Enable Configuration and Issue SSL Certificates
```bash
sudo ln -s /etc/nginx/sites-available/joelacademy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 5. PM2 Process Management

Launch and daemonize application processes using PM2:

### Start Processes
```bash
# 1. Start Backend API
cd /var/www/joel-academy/apps/api
pm2 start dist/src/main.js --name "joel-api" --env production

# 2. Start Frontend Web Server
cd /var/www/joel-academy/apps/web
pm2 start npm --name "joel-web" -- start --env production

# 3. Save PM2 State & Enable System Boot Auto-Start
pm2 save
pm2 startup
```

### Useful PM2 Monitoring Commands
```bash
pm2 status                  # Check running process status
pm2 logs                    # View live application log output
pm2 logs joel-api           # View backend API logs
pm2 restart all             # Restart all services after deployment update
```

---

## 6. Vercel & Render Alternative Setup

### Vercel (Frontend Deployment)
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: `.next`
- Environment Variables: Set `NEXT_PUBLIC_API_URL` to `https://api.yourdomain.com/api/v1`.

### Render (Backend Deployment)
- Environment: Node
- Build Command: `npm run build:api`
- Start Command: `npm run start:prod -w @joel-academy/api`
- Environment Variables: Copy backend production variables from `.env.production`.

---

## 7. Production Verification & Monitoring

1. **API Health Check**:
   ```bash
   curl -I https://api.yourdomain.com/api/v1/health
   ```
   *Expected Response: HTTP/1.1 200 OK*

2. **Frontend Availability**:
   ```bash
   curl -I https://yourdomain.com
   ```
   *Expected Response: HTTP/1.1 200 OK*

3. **Database Connectivity Verification**:
   ```bash
   npm run db:check
   ```

---

## 8. Backup & Maintenance Procedures

### Applying Zero-Downtime Code Updates
```bash
cd /var/www/joel-academy
git pull origin main
npm install
npm run db:migrate
npm run build
pm2 reload all
```

### Database Backup
Neon PostgreSQL handles continuous automated point-in-time backups. To create a manual logical backup:
```bash
pg_dump "$DATABASE_DIRECT_URL" > joel_academy_backup_$(date +%F).sql
```
