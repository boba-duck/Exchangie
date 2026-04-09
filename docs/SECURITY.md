# Email Exchange Competitor - Security Best Practices

## Network Security

### Firewall Rules

Expose only necessary ports:

```
Port 25   (SMTP)           -> Restrict to known senders
Port 110  (POP3)           -> Restrict to authenticated users
Port 143  (IMAP)           -> Restrict to authenticated users
Port 443  (HTTPS)          -> Public access
Port 587  (SMTP TLS)       -> Public access
Port 993  (IMAP SSL)       -> Public access
Port 995  (POP3 SSL)       -> Public access
```

Block all other ports:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 25
ufw allow 110
ufw allow 143
ufw allow 443
ufw allow 587
ufw allow 993
ufw allow 995
ufw enable
```

### TLS/SSL Configuration

Use strong certificates:

```bash
# Generate CSR
openssl req -new -newkey rsa:4096 -keyout server.key -out server.csr

# Submit to trusted CA (Let's Encrypt recommended)
certbot certonly --manual --preferred-challenges=dns -d mail.example.com

# Update certificate paths in .env
TLS_CERT_PATH=/etc/letsencrypt/live/mail.example.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/mail.example.com/privkey.pem
```

## Email Security

### SPF Configuration

```dns
example.com TXT "v=spf1 ip4:192.0.2.1 include:mailprovider.com ~all"
```

### DKIM Configuration

```dns
default._domainkey.example.com TXT "v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>"
```

### DMARC Policy

```dns
_dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:admin@example.com"
```

## Database Security

### PostgreSQL

```sql
-- Create dedicated user
CREATE USER emailserver WITH PASSWORD 'strong_password';
GRANT CREATE ON DATABASE emailserver_db TO emailserver;

-- Restrict connections
-- In postgresql.conf: listen_addresses = '127.0.0.1'
```

### Redis

```conf
# In redis.conf
requirepass your_strong_password
# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

## Application Security

### JWT Security

- Use strong SECRET key (32+ characters)
- Rotate keys regularly
- Implement token expiration
- Use HTTPS exclusively

### Password Policy

```env
MIN_PASSWORD_LENGTH=12
REQUIRE_UPPERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SPECIAL_CHARS=true
PASSWORD_EXPIRY_DAYS=90
PASSWORD_HISTORY_COUNT=5
```

### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_BYPASS_ADMIN=false
```

## Backup & Recovery

### Database Backups

```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups/email"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker exec email-db pg_dump -U emailserver emailserver_db | \
  gzip > $BACKUP_DIR/emailserver_$DATE.sql.gz

# Encrypt and upload
gpg --encrypt $BACKUP_DIR/emailserver_$DATE.sql.gz
aws s3 cp $BACKUP_DIR/emailserver_$DATE.sql.gz.gpg s3://backups/email/

# Cleanup old backups (30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Recovery Procedure

```bash
# Restore from backup
gzip -dc backup.sql.gz | \
  docker exec -i email-db psql -U emailserver emailserver_db
```

## Logging & Monitoring

### Enable Audit Logging

```env
AUDIT_LOG_ENABLED=true
AUDIT_LOG_LEVEL=comprehensive
AUDIT_LOG_RETENTION_DAYS=366
```

### Monitor Traffic

```bash
# Enable network monitoring
tcpdump -i eth0 -w capture.pcap port 25 or port 143 or port 110

# Monitor system resources
watches=$(watch -n 1 'docker stats --no-stream')
```

## User Security

### Force Password Updates

```sql
UPDATE users SET password_changed_at = NOW() - interval '90 days'
WHERE password_changed_at < NOW() - interval '90 days';
```

### Disable Inactive Accounts

```sql
UPDATE users SET is_active = false
WHERE last_login < NOW() - interval '6 months';
```

### Review Admin Users

```sql
SELECT * FROM users WHERE is_admin = true;
```

## Incident Response

### Security Breach Checklist

1. **Immediate Actions**
   - Disable affected user accounts
   - Reset database passwords
   - Review audit logs
   - Collect forensic data

2. **Investigation**
   - Identify breach scope
   - Document timeline
   - Preserve evidence
   - Notify stakeholders

3. **Recovery**
   - Restore from clean backup
   - Reset credentials
   - Update security policies
   - Enable monitoring

4. **Post-Incident**
   - Conduct security audit
   - Update documentation
   - Train staff
   - Implement preventive measures

## Compliance

### GDPR Compliance

- Enable data export functionality
- Implement right to deletion
- Document data processing
- Obtain user consent for marketing

### Data Retention

```env
# Retention policies
ARCHIVE_RETENTION_DAYS=2555  # 7 years
DELETED_EMAIL_RETENTION_DAYS=30
AUDIT_LOG_RETENTION_DAYS=366
```

## Regular Security Tasks

- [ ] Patch systems weekly
- [ ] Review audit logs daily
- [ ] Backup databases daily
- [ ] Update SSL certificates (90 days before expiry)
- [ ] Reset admin passwords monthly
- [ ] Run security scans quarterly
- [ ] Audit user access semi-annually
- [ ] Penetration testing annually

---

**Last Updated**: 2024
