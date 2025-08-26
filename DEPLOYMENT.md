# TGPro Deployment Guide

Complete deployment guide for TGPro - Telegram Automation Platform. This guide covers various deployment scenarios from development to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Security Configuration](#security-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps connection

#### Recommended (Production)
- **CPU**: 4 cores, 3.0 GHz
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps connection

### Software Dependencies

#### Backend Requirements
- **Python**: 3.11 or higher
- **MongoDB**: 5.0 or higher
- **Redis**: 6.0 or higher (optional, for caching)

#### Frontend Requirements
- **Node.js**: 18.0 or higher
- **Yarn**: 1.22 or higher

#### System Tools
- **Git**: Version control
- **Nginx**: Reverse proxy (production)
- **Supervisor**: Process management
- **Certbot**: SSL certificates (production)

## 🌍 Environment Setup

### Environment Variables

Create environment files for different stages:

#### Backend (.env)
```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/tgpro
MONGO_DB_NAME=tgpro

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Telegram Bot
TELEGRAM_BOT_TOKEN=7400143812:AAHVS-Wr40Y4GgtgfymzBmVUvUiBazMbozI

# API Configuration
API_KEY=telegram-automation-key-2025
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30

# Security
RATE_LIMIT_ENABLED=true
MAX_REQUESTS_PER_MINUTE=100

# Features
ENABLE_WEBSOCKET=true
ENABLE_ASYNC_TASKS=true
```

#### Frontend (.env)
```bash
# API Configuration
REACT_APP_BACKEND_URL=http://localhost:8001/api

# App Configuration
REACT_APP_NAME=TGPro
REACT_APP_VERSION=3.1.0

# Features
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_ENABLE_REAL_TIME=true

# Analytics (optional)
REACT_APP_ANALYTICS_ID=your-analytics-id
```

### Development Environment
```bash
# Development overrides
NODE_ENV=development
PYTHON_ENV=development
DEBUG=true
ENABLE_CORS=true
```

### Production Environment
```bash
# Production overrides
NODE_ENV=production
PYTHON_ENV=production
DEBUG=false
ENABLE_CORS=false
SECURE_COOKIES=true
HTTPS_ONLY=true
```

## 🚀 Development Deployment

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/tgpro.git
   cd tgpro
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod --dbpath /path/to/db
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:5.0
   ```

5. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend
   python server.py
   
   # Terminal 2: Frontend
   cd frontend
   yarn start
   ```

6. **Verify Installation**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/docs
   - Health Check: http://localhost:8001/api/health

## 🏭 Production Deployment

### Using Supervisor (Recommended)

#### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv nodejs npm nginx supervisor mongodb-server

# Install Yarn
npm install -g yarn

# Create application user
sudo useradd -m -s /bin/bash tgpro
sudo usermod -aG sudo tgpro
```

#### 2. Application Setup

```bash
# Switch to application user
sudo su - tgpro

# Clone repository
git clone https://github.com/your-org/tgpro.git /opt/tgpro
cd /opt/tgpro

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
yarn install
yarn build

# Set permissions
sudo chown -R tgpro:tgpro /opt/tgpro
```

#### 3. Supervisor Configuration

Create `/etc/supervisor/conf.d/tgpro.conf`:

```ini
[group:tgpro]
programs=tgpro-backend,tgpro-frontend

[program:tgpro-backend]
command=/opt/tgpro/backend/venv/bin/python server.py
directory=/opt/tgpro/backend
user=tgpro
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/tgpro-backend.log
environment=PYTHONPATH="/opt/tgpro/backend"

[program:tgpro-frontend]
command=/usr/bin/yarn start
directory=/opt/tgpro/frontend
user=tgpro
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/tgpro-frontend.log
environment=NODE_ENV="production"

[program:mongodb]
command=/usr/bin/mongod --config /etc/mongod.conf
user=mongodb
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/mongodb.log
```

#### 4. Start Services

```bash
# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start all services
sudo supervisorctl start tgpro:*

# Check status
sudo supervisorctl status
```

### Nginx Configuration

Create `/etc/nginx/sites-available/tgpro`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # API Routes (Backend)
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend Routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle React Router
        try_files $uri $uri/ @react;
    }
    
    location @react {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/tgpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🐳 Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: tgpro-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
      MONGO_INITDB_DATABASE: tgpro
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - tgpro-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tgpro-backend
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      MONGO_URL: mongodb://admin:secure_password@mongodb:27017/tgpro?authSource=admin
      ENCRYPTION_KEY: your-32-character-encryption-key-here
      JWT_SECRET_KEY: your-jwt-secret-key-here
      TELEGRAM_BOT_TOKEN: 7400143812:AAHVS-Wr40Y4GgtgfymzBmVUvUiBazMbozI
    ports:
      - "8001:8001"
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/data:/app/data
    networks:
      - tgpro-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tgpro-frontend
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      REACT_APP_BACKEND_URL: http://backend:8001/api
    ports:
      - "3000:3000"
    networks:
      - tgpro-network

  nginx:
    image: nginx:alpine
    container_name: tgpro-nginx
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - tgpro-network

volumes:
  mongodb_data:

networks:
  tgpro-network:
    driver: bridge
```

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 tgpro && chown -R tgpro:tgpro /app
USER tgpro

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Start application
CMD ["python", "server.py"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code and build
COPY . .
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=2

# Stop services
docker-compose down

# Update services
docker-compose pull
docker-compose up -d
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using EC2 + RDS + ELB

1. **Infrastructure Setup**
   ```bash
   # Create EC2 instance
   aws ec2 run-instances \
     --image-id ami-0c02fb55956c7d316 \
     --instance-type t3.medium \
     --key-name your-key-pair \
     --security-group-ids sg-xxxxxxxxx
   
   # Create RDS MongoDB-compatible DocumentDB
   aws docdb create-db-cluster \
     --db-cluster-identifier tgpro-cluster \
     --engine docdb \
     --master-username admin \
     --master-user-password SecurePassword123
   ```

2. **Application Deployment**
   ```bash
   # SSH to EC2 instance
   ssh -i your-key.pem ec2-user@your-instance-ip
   
   # Install Docker
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo usermod -a -G docker ec2-user
   
   # Deploy with Docker Compose
   git clone your-repo
   cd tgpro
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Google Cloud Platform

#### Using Google Kubernetes Engine (GKE)

1. **Create Kubernetes Cluster**
   ```bash
   gcloud container clusters create tgpro-cluster \
     --zone us-central1-a \
     --num-nodes 3 \
     --machine-type n1-standard-2
   ```

2. **Deploy Application**
   ```bash
   # Build and push images
   docker build -t gcr.io/your-project/tgpro-backend backend/
   docker build -t gcr.io/your-project/tgpro-frontend frontend/
   docker push gcr.io/your-project/tgpro-backend
   docker push gcr.io/your-project/tgpro-frontend
   
   # Deploy to Kubernetes
   kubectl apply -f k8s/
   ```

### Azure Deployment

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name tgpro-rg --location eastus

# Create container group
az container create \
  --resource-group tgpro-rg \
  --name tgpro-app \
  --image your-registry/tgpro:latest \
  --dns-name-label tgpro-app \
  --ports 80 443
```

## 🔒 Security Configuration

### Firewall Setup

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### MongoDB Security

```javascript
// mongo-init.js
db = db.getSiblingDB('tgpro');
db.createUser({
  user: 'tgpro_user',
  pwd: 'secure_password_here',
  roles: [
    {
      role: 'readWrite',
      db: 'tgpro'
    }
  ]
});
```

MongoDB configuration `/etc/mongod.conf`:
```yaml
security:
  authorization: enabled
  
net:
  bindIp: 127.0.0.1
  port: 27017
  
storage:
  wiredTiger:
    engineConfig:
      configString: "encryption=(name=AES256-CBC,keyid=0)"
```

### Environment Security

```bash
# Set secure file permissions
chmod 600 /opt/tgpro/backend/.env
chmod 600 /opt/tgpro/frontend/.env

# Create backup user
sudo useradd -m -s /bin/bash backup
echo "backup ALL=(tgpro) NOPASSWD: /opt/tgpro/scripts/backup.sh" | sudo tee -a /etc/sudoers

# Setup logrotate
sudo tee /etc/logrotate.d/tgpro << EOF
/var/log/supervisor/tgpro-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        supervisorctl restart tgpro:*
    endscript
}
EOF
```

## 📊 Monitoring & Maintenance

### Health Monitoring

Create `/opt/tgpro/scripts/health-check.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:8001/api/health"
API_KEY="telegram-automation-key-2025"
LOG_FILE="/var/log/tgpro-health.log"
ALERT_EMAIL="admin@yourdomain.com"

# Health check
response=$(curl -s -H "Authorization: Bearer $API_KEY" "$API_URL")
status=$(echo "$response" | jq -r '.data.status')

if [ "$status" != "healthy" ]; then
    echo "$(date): ALERT - TGPro health check failed" >> "$LOG_FILE"
    echo "$response" >> "$LOG_FILE"
    
    # Send alert email
    echo "TGPro health check failed at $(date)" | mail -s "TGPro Alert" "$ALERT_EMAIL"
    
    # Restart services
    sudo supervisorctl restart tgpro:*
else
    echo "$(date): OK - TGPro is healthy" >> "$LOG_FILE"
fi
```

Add to crontab:
```bash
# Check every 5 minutes
*/5 * * * * /opt/tgpro/scripts/health-check.sh
```

### Backup Strategy

Create `/opt/tgpro/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/tgpro"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# MongoDB backup
mongodump --host localhost:27017 --db tgpro --out "$BACKUP_DIR/mongodb_$DATE"

# Application backup
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /opt/tgpro --exclude="*/venv/*" --exclude="*/node_modules/*"

# Configuration backup
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /opt/tgpro/backend/.env /opt/tgpro/frontend/.env

# Remove old backups
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

### Monitoring with Prometheus & Grafana

Create `monitoring/docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

## 🛠️ Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check supervisor logs
sudo supervisorctl tail -f tgpro-backend stderr

# Check application logs
tail -f /var/log/supervisor/tgpro-backend.log

# Check system resources
htop
df -h
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongo --host localhost:27017 --eval "db.adminCommand('ismaster')"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart services to free memory
sudo supervisorctl restart tgpro:*
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test nginx configuration
sudo nginx -t
```

### Performance Optimization

#### Backend Optimization
```python
# Add to server.py
import uvloop
uvloop.install()

# Increase worker processes
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        workers=4,  # Increase workers
        loop="uvloop"
    )
```

#### Database Optimization
```javascript
// Add indexes in MongoDB
db.users.createIndex({ "telegram_id": 1 })
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })
db.tasks.createIndex({ "status": 1, "created_at": -1 })
```

#### Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Log Analysis

```bash
# Analyze error patterns
grep "ERROR" /var/log/supervisor/tgpro-backend.log | tail -50

# Monitor real-time logs
tail -f /var/log/supervisor/tgpro-*.log | grep -E "(ERROR|WARNING)"

# Check disk usage by logs
du -sh /var/log/supervisor/tgpro-*
```

## 📞 Support

For deployment support:

1. **Check Documentation**: Review this guide and [README.md](./README.md)
2. **Check Logs**: Always check application and system logs first
3. **Health Check**: Use `/api/health` endpoint to verify system status
4. **Community**: Check GitHub issues for similar problems
5. **Professional Support**: Contact the development team for enterprise support

---

This deployment guide covers most common scenarios. For specific cloud providers or custom setups, refer to their respective documentation alongside this guide.