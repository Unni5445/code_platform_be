# Hostinger VPS Deployment Guide

This guide will walk you through deploying your full-stack application (Backend + Frontend + Student Dashboard) on a Hostinger VPS server.

## Prerequisites

- Hostinger VPS with Ubuntu 20.04 or 22.04 LTS
- SSH access to your VPS
- A MongoDB Atlas account (cloud database) or MongoDB server
- A domain name (optional but recommended)

---

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip-address
```

---

## Step 2: Update System Packages

```bash
apt update && apt upgrade -y
```

---

## Step 3: Install Node.js and NPM

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node -v
npm -v
```

---

## Step 4: Install PM2 (Process Manager)

```bash
npm install -g pm2

# Start PM2 as a system service
pm2 startup systemd
pm2 save
```

---

## Step 5: Install Nginx (Web Server)

```bash
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

---

## Step 6: Install MongoDB

### Option A: Using MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster
2. Get your connection string from the Atlas dashboard
3. Create a `.env` file in your backend directory with the connection string

### Option B: Install MongoDB Locally on VPS

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
apt update

# Install MongoDB
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod
```

---

## Step 7: Setup Project Directory

```bash
# Create project directory
mkdir -p /var/www/code-platform
cd /var/www/code-platform

# Clone your repository (if using Git)
git clone your-repository-url .

# Or upload files manually via SCP
```

---

## Step 8: Install Backend Dependencies

```bash
cd /var/www/code-platform/backend

# Install dependencies
npm install --production

# Build TypeScript files
npm run build
```

---

## Step 9: Create Environment Configuration

Create a `.env` file in the backend directory:

```bash
cd /var/www/code-platform/backend
nano .env
```

Add the following configuration:

```env
PORT=5454
MONGO_DB=mongodb+srv://username:password@cluster.mongodb.net/your-database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
ALLOWED_ORIGINS=https://app.yourdomain.com,https://www.app.yourdomain.com,https://student.yourdomain.com,https://www.student.yourdomain.com
COOKIE_SECRET=your-cookie-secret-key
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
API_KEY=your-api-key-here
```

**Important:** Replace all placeholder values with your actual credentials.

---

## Step 10: Setup Frontend

```bash
cd /var/www/code-platform/front-end

# Install dependencies
npm install --production

# Build the frontend
npm run build

# The build output will be in the 'dist' folder
```

---

## Step 11: Setup Student Dashboard

```bash
cd /var/www/code-platform/student_dashboard

# Install dependencies
npm install --production

# Build the dashboard
npm run build

# The build output will be in the 'dist' folder
```

---

## Step 12: Configure Nginx

Create a new Nginx configuration file:

```bash
nano /etc/nginx/sites-available/code-platform
```

Add the following configuration:

```nginx
# Backend API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5454;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Main Application Frontend
server {
    listen 80;
    server_name app.yourdomain.com www.app.yourdomain.com;

    root /var/www/code-platform/front-end/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:5454;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Student Dashboard
server {
    listen 80;
    server_name student.yourdomain.com www.student.yourdomain.com;

    root /var/www/code-platform/student_dashboard/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Student Dashboard routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Student Dashboard API proxy to backend
    location /api {
        proxy_pass http://localhost:5454;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

```

**Important:** Replace `app.yourdomain.com`, `student.yourdomain.com`, and `api.yourdomain.com` with your actual domain names.

Enable the configuration:

```bash
ln -s /etc/nginx/sites-available/code-platform /etc/nginx/sites-enabled/
```

Test the Nginx configuration:

```bash
nginx -t
```

If there are no errors, restart Nginx:

```bash
systemctl restart nginx
```

---

## Step 13: Configure Firewall

```bash
# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# Enable firewall (if not already enabled)
ufw enable
```

---

## Step 14: Setup SSL Certificate (Let's Encrypt)

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Get SSL certificate:

```bash
certbot --nginx -d app.yourdomain.com -d www.app.yourdomain.com -d student.yourdomain.com -d www.student.yourdomain.com -d api.yourdomain.com
```

Follow the prompts to complete the installation.

Certbot will automatically configure SSL and renew certificates.

---

## Step 15: Start Backend with PM2

Create a PM2 ecosystem configuration file:

```bash
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [{
    name: 'code-platform-backend',
    script: './dist/app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5454
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Start the backend:

```bash
cd /var/www/code-platform/backend
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
```

---

## Step 16: Verify Deployment

1. Check if backend is running:
```bash
pm2 status
pm2 logs code-platform-backend
```

2. Check if Nginx is running:
```bash
systemctl status nginx
```

3. Test your application:
   - Visit `https://yourdomain.com` in your browser
   - Visit `https://api.yourdomain.com` to test the API
   - Visit `https://yourdomain.com/student` to test the student dashboard

---

## Step 17: Database Setup (MongoDB)

### If using MongoDB Atlas:

1. Create a database user in Atlas
2. Update your `.env` file with the new credentials
3. Restart the backend:
```bash
pm2 restart code-platform-backend
```

### If using local MongoDB:

```bash
# Create database and user
mongosh
use code_platform
db.createUser({
  user: "your-username",
  pwd: "your-password",
  roles: [{ role: "readWrite", db: "code_platform" }]
})
```

---

## Step 18: Database Initialization (Optional)

Create an initialization script to set up collections:

```bash
cd /var/www/code-platform/backend
node scripts/init-db.js
```

---

## Monitoring and Maintenance

### Check Logs

```bash
# Backend logs
pm2 logs code-platform-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Update Application

```bash
cd /var/www/code-platform
git pull origin main

# Update backend
cd backend
npm install --production
npm run build
pm2 restart code-platform-backend

# Update frontend
cd ../front-end
npm install --production
npm run build

# Update student dashboard
cd ../student_dashboard
npm install --production
npm run build
```

### Backup Database

```bash
# Create backup script
nano /var/www/code-platform/scripts/backup-db.sh

# Add the following:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db=code_platform --out=/var/backups/mongodb/$DATE

# Make it executable
chmod +x /var/www/code-platform/scripts/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /var/www/code-platform/scripts/backup-db.sh
```

---

## Security Best Practices

1. **Change default ports**: Don't use default ports for services
2. **Use strong passwords**: For database and API keys
3. **Keep software updated**: Regularly update Node.js, Nginx, and MongoDB
4. **Enable firewall**: Use UFW to restrict access
5. **Use SSL/TLS**: Always use HTTPS
6. **Regular backups**: Set up automated database backups
7. **Monitor logs**: Regularly check logs for suspicious activity
8. **Use environment variables**: Never commit `.env` files to Git
9. **Set up rate limiting**: Already configured in your backend
10. **Use API keys**: Protect sensitive endpoints

---

## Troubleshooting

### Backend not starting

```bash
# Check PM2 logs
pm2 logs code-platform-backend --lines 100

# Check for errors
pm2 show code-platform-backend
```

### Frontend not loading

```bash
# Check Nginx configuration
nginx -t

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Verify frontend build exists
ls -la /var/www/code-platform/front-end/dist
```

### Database connection issues

```bash
# Check MongoDB status
systemctl status mongod

# Test MongoDB connection
mongosh --uri "mongodb+srv://username:password@cluster.mongodb.net/your-database"
```

### SSL certificate issues

```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)

---

## Summary

Your application is now deployed on your Hostinger VPS with:
- ✅ Backend running with PM2
- ✅ Frontend served via Nginx
- ✅ Student dashboard accessible
- ✅ SSL/TLS encryption
- ✅ Firewall configured
- ✅ Automated backups (optional)

For any issues or questions, refer to the troubleshooting section or check the logs.
