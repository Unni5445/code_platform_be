# Subdomain Structure for Deployment

This document explains the recommended subdomain structure for your application deployment on Hostinger VPS.

## Recommended Subdomain Configuration

### 1. Main Application Frontend
- **Subdomain**: `app.yourdomain.com`
- **WWW Subdomain**: `www.app.yourdomain.com`
- **Purpose**: Main admin/dashboard application for administrators, instructors, and staff
- **Access**: https://app.yourdomain.com
- **Features**:
  - User management
  - Course creation and management
  - Test/question management
  - Student enrollment
  - Analytics and reports
  - Certificate management

### 2. Student Dashboard
- **Subdomain**: `student.yourdomain.com`
- **WWW Subdomain**: `www.student.yourdomain.com`
- **Purpose**: Student-facing portal for learning and progress tracking
- **Access**: https://student.yourdomain.com
- **Features**:
  - View enrolled courses
  - Access course content
  - Take tests and quizzes
  - View certificates
  - Track progress and performance
  - View leaderboard

### 3. API Server
- **Subdomain**: `api.yourdomain.com`
- **Purpose**: Backend API server serving all REST endpoints
- **Access**: https://api.yourdomain.com
- **Features**:
  - RESTful API endpoints
  - Authentication and authorization
  - Database operations
  - File upload/download
  - Email services

## DNS Configuration

### Hostinger DNS Settings

1. **Add A Records**:
   ```
   Type: A
   Name: app
   Value: your-vps-ip-address
   TTL: 3600
   ```

   ```
   Type: A
   Name: www
   Value: your-vps-ip-address
   TTL: 3600
   ```

   ```
   Type: A
   Name: student
   Value: your-vps-ip-address
   TTL: 3600
   ```

   ```
   Type: A
   Name: api
   Value: your-vps-ip-address
   TTL: 3600
   ```

2. **Add CNAME Records** (optional for www):
   ```
   Type: CNAME
   Name: www
   Value: app
   TTL: 3600
   ```

   ```
   Type: CNAME
   Name: www
   Value: student
   TTL: 3600
   ```

   ```
   Type: CNAME
   Name: www
   Value: api
   TTL: 3600
   ```

### DNS Propagation Time

- DNS changes typically propagate within 5-30 minutes
- Use `nslookup` or `dig` to verify DNS resolution:
  ```bash
  nslookup app.yourdomain.com
  nslookup student.yourdomain.com
  nslookup api.yourdomain.com
  ```

## SSL Certificates

### Let's Encrypt SSL Configuration

When running Certbot, include all subdomains:

```bash
certbot --nginx -d app.yourdomain.com -d www.app.yourdomain.com -d student.yourdomain.com -d www.student.yourdomain.com -d api.yourdomain.com
```

This will automatically:
1. Obtain SSL certificates for all subdomains
2. Configure HTTPS
3. Set up automatic certificate renewal

### SSL Certificate Locations

- **Certificates**: `/etc/letsencrypt/live/app.yourdomain.com/fullchain.pem`
- **Private Key**: `/etc/letsencrypt/live/app.yourdomain.com/privkey.pem`
- **Certificate Chain**: `/etc/letsencrypt/live/app.yourdomain.com/chain.pem`

## Firewall Configuration

Ensure firewall allows traffic on ports 80 and 443:

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw status
```

## Security Considerations

### 1. API Key Protection
- All API endpoints are protected by API key authentication
- Each subdomain should use the same API key for consistency
- Generate a strong, unique API key for production use

### 2. CORS Configuration
- Backend CORS is configured to allow all three subdomains
- Update `.env` file with correct `ALLOWED_ORIGINS` as shown in the deployment guide

### 3. Rate Limiting
- API endpoints have rate limiting enabled
- Adjust limits based on expected traffic

### 4. HTTPS Only
- All traffic should be served over HTTPS
- HTTP to HTTPS redirects are automatically configured by Certbot

## Testing Your Deployment

### 1. Test API Server
```bash
curl https://api.yourdomain.com/api/v1/health
```

### 2. Test Main Application
- Open browser: https://app.yourdomain.com
- Verify all features work correctly

### 3. Test Student Dashboard
- Open browser: https://student.yourdomain.com
- Verify student features work correctly

### 4. Test SSL Certificate
```bash
openssl s_client -connect app.yourdomain.com:443 -servername app.yourdomain.com
```

## Troubleshooting

### DNS Not Resolving
```bash
# Check DNS resolution
dig app.yourdomain.com
nslookup app.yourdomain.com

# Check if DNS is propagated
dig @8.8.8.8 app.yourdomain.com
```

### SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew --dry-run

# Check Nginx SSL configuration
nginx -t
```

### Subdomain Not Working
1. Verify DNS records are correct
2. Check DNS propagation time
3. Verify Nginx configuration is correct
4. Restart Nginx: `systemctl restart nginx`
5. Check Nginx error logs: `tail -f /var/log/nginx/error.log`

## Monitoring

### Check Nginx Status
```bash
systemctl status nginx
```

### Check PM2 Status
```bash
pm2 status
pm2 logs
```

### Check SSL Expiry
```bash
certbot certificates
```

## Backup Strategy

### Database Backups
- Set up automated MongoDB backups (see deployment guide)
- Store backups in a secure location

### Configuration Backups
- Backup `.env` files
- Backup Nginx configuration files
- Backup PM2 ecosystem configurations

## Additional Resources

- [Hostinger VPS Documentation](https://www.hostinger.com/tutorials/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
