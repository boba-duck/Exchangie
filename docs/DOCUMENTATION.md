# Email Exchange Competitor - Full Documentation

## Table of Contents
1. [Architecture](#architecture)
2. [Components](#components)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [API Documentation](#api-documentation)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

## Architecture

The system is built as a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │  Webmail Frontend   │  │  Admin Dashboard                 │  │
│  │  (React/Vite)       │  │  (React/Vite)                    │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                            │
│    Load balancing, SSL termination, reverse proxy                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┬─────────────────┬─────────────────┐
        ↓                   ↓                 ↓                 ↓
   ┌─────────┐        ┌──────────┐    ┌──────────┐     ┌───────┐
   │ Backend │        │ Gateway  │    │ Frontend │     │ Admin │
   │ Service │        │ Service  │    │ Service  │     │ Svc   │
   │(SMTP/   │        │(Spam     │    │(API)     │     │(API)  │
   │IMAP/    │        │Filter)   │    │          │     │       │
   │POP3)    │        │          │    │          │     │       │
   └─────────┘        └──────────┘    └──────────┘     └───────┘
        ↓                   ↓                 ↓                 ↓
        └───────────────────┴─────────────────┴─────────────────┘
                            ↓
                ┌────────────────────────────┐
                │   PostgreSQL Database      │
                │   Redis Cache/Queue        │
                └────────────────────────────┘
```

## Components

### 1. Backend Service (`backend/`)
- **SMTP Server**: Handles email reception (ports 25, 587, 465)
- **IMAP Server**: Provides email client access (ports 143, 993)
- **POP3 Server**: Legacy email retrieval (ports 110, 995)
- **Admin API**: RESTful API for management
- **WebMail API**: RESTful API for client operations

**Key Features:**
- Multi-domain support
- User & mailbox management
- Message storage & retrieval
- Spam filtering integration
- Email threading
- Distribution lists
- Mail flow rules

### 2. Email Gateway (`gateway/`)
- **Inbound Email Filtering**: Spam detection, malware scanning
- **Security Checks**: DKIM, SPF, DMARC verification
- **Phishing Detection**: URL and content analysis
- **Rate Limiting**: IP reputation, greylisting
- **Quarantine Management**: Admin and user quarantine

### 3. Webmail Frontend (`frontend/`)
- Modern React-based interface
- Responsive design (desktop, tablet, mobile)
- Features:
  - Compose/Reply/Forward
  - Inbox management
  - Contact management
  - Calendar integration
  - Search & filtering
  - Rules & signatures

### 4. Admin Dashboard (`admin-dashboard/`)
- Administrator console
- Features:
  - User management
  - Domain configuration
  - Mail flow rule management
  - Spam filter configuration
  - Audit logs & reporting
  - System monitoring
  - Backup management

### 5. Database Layer
- **PostgreSQL**: Primary data storage
- **Redis**: Cache, session store, message queues

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 13+ (if self-hosted)
- Redis 6+ (if self-hosted)

### Local Development Setup

1. **Clone and install dependencies**
```bash
cd email-exchange
npm install  # Installs all workspaces
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database**
```bash
npm run db:migrate  # Run migrations
```

4. **Start all services**
```bash
npm run dev  # Starts all services in development mode
```

## Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Server
NODE_ENV=production
BACKEND_PORT=3000
ADMIN_API_PORT=3001
GATEWAY_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=emailserver
DB_PASSWORD=changeme
DB_NAME=emailserver_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Protocols
SMTP_PORT=25
SMTP_TLS_PORT=587
SMTP_SSL_PORT=465
IMAP_PORT=143
IMAP_SSL_PORT=993
POP3_PORT=110
POP3_SSL_PORT=995

# Server Configuration
HOSTNAME=mail.example.com
DOMAIN=example.com
PRIMARY_DOMAIN=example.com

# TLS/SSL
TLS_ENABLED=true
TLS_CERT_PATH=/certs/server.crt
TLS_KEY_PATH=/certs/server.key

# Spam Filter
SPAM_FILTER_ENABLED=true
SPAM_SCORE_THRESHOLD=5.0
ENABLE_ML_SPAM_DETECTION=true

# Email Security
ENABLE_DKIM_SIGNING=true
ENABLE_SPF_CHECK=true
ENABLE_DMARC_COMPLIANCE=true

# Archiving
EMAIL_ARCHIVING_ENABLED=true
ARCHIVE_RETENTION_DAYS=2555
```

### Domain Configuration

To add a new domain:

1. **Via Admin API:**
```bash
POST /api/domains
{
  "name": "example.com",
  "description": "Example domain",
  "max_users": 1000,
  "max_mailbox_size_mb": 10240
}
```

2. **Configure DNS Records:**
```
# MX Record
example.com  MX  10  mail.example.com

# SPF Record
example.com  TXT  "v=spf1 mx ~all"

# DMARC Policy
_dmarc.example.com  TXT  "v=DMARC1; p=quarantine; rua=mailto:admin@example.com"

# DKIM (generated by system)
default._domainkey.example.com  TXT  "v=DKIM1; k=rsa; p=<public-key>"
```

## Deployment

### Docker Deployment

1. **Build images:**
```bash
npm run docker:build
```

2. **Start services:**
```bash
npm run docker:up
```

3. **Check health:**
```bash
docker-compose -f deployment/docker/docker-compose.yml ps
```

4. **View logs:**
```bash
docker-compose -f deployment/docker/docker-compose.yml logs -f
```

### Kubernetes Deployment

1. **Prepare cluster:**
```bash
# Create namespace
kubectl apply -f deployment/kubernetes/email-system.yaml

# Verify deployment
kubectl get pods -n email-system
```

2. **Access services:**
```bash
kubectl get svc -n email-system
```

3. **Check logs:**
```bash
kubectl logs -n email-system <pod-name>
```

### Production Considerations

- Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
- Configure backup strategy
- Enable SSL/TLS certificates
- Set up DNS records properly
- Configure SPF, DKIM, DMARC
- Enable IP whitelisting
- Monitor system performance
- Set up automated backups

## API Documentation

### Authentication

All API requests (except `/health`) require authentication:

```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

### User Endpoints

```bash
# Create user
POST /api/users
Authorization: Bearer <token>
{
  "username": "john",
  "email": "john@example.com",
  "password": "secure_password",
  "domainId": "uuid",
  "displayName": "John Doe"
}

# Get user
GET /api/users/{id}
Authorization: Bearer <token>

# Update user
PATCH /api/users/{id}
Authorization: Bearer <token>
{
  "displayName": "Jane Doe",
  "mailbox_quota_mb": 20480
}

# Delete user
DELETE /api/users/{id}
Authorization: Bearer <token>
```

### Message Endpoints

```bash
# Get messages
GET /api/mailboxes/{mailboxId}/messages?limit=50&offset=0
Authorization: Bearer <token>

# Get single message
GET /api/messages/{messageId}
Authorization: Bearer <token>

# Update message flags
PATCH /api/messages/{messageId}
Authorization: Bearer <token>
{
  "is_read": true,
  "is_starred": false
}

# Delete message
DELETE /api/messages/{messageId}
Authorization: Bearer <token>

# Search messages
GET /api/mailboxes/{mailboxId}/search?q=keyword
Authorization: Bearer <token>
```

### Admin Endpoints

```bash
# Get all domains
GET /api/domains
Authorization: Bearer <admin-token>

# Create domain
POST /api/domains
Authorization: Bearer <admin-token>
{
  "name": "example.com",
  "max_users": 1000
}

# Get audit logs
GET /api/audit-logs?limit=50
Authorization: Bearer <admin-token>

# Get system stats
GET /api/stats
Authorization: Bearer <admin-token>
```

### Gateway Endpoints

```bash
# Scan inbound email
POST /api/inbound
{
  "email": {
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Test",
    "body": "Email content"
  }
}

# Response
{
  "status": "pass",
  "threats": [],
  "score": 0
}

# Classify email
POST /api/classify
{
  "email": {...}
}

# Response
{
  "isSpam": false,
  "confidence": 0.95,
  "category": "legitimate"
}
```

## Security

### Best Practices

1. **SSL/TLS**: Always use encrypted connections
2. **Authentication**: Implement strong password policies
3. **RBAC**: Use role-based access control
4. **Audit Logs**: Monitor and log all actions
5. **Data Protection**: Enable email encryption
6. **Backup**: Regular database backups
7. **Firewall**: Restrict access to email ports
8. **Rate Limiting**: Prevent abuse

### Email Authentication

- **DKIM**: Digitally sign emails
- **SPF**: Specify authorized mail servers
- **DMARC**: Define authentication policy

### Data Encryption

- TLS in transit
- Optional PGP/S-MIME for end-to-end encryption
- Encrypted password storage (bcrypt)

## Troubleshooting

### Common Issues

**Cannot connect to database:**
```bash
# Check PostgreSQL is running
docker exec email-db psql -U emailserver -d emailserver_db -c "SELECT 1"
```

**SMTP not receiving emails:**
- Verify DNS MX records
- Check firewall rules (port 25)
- Review SMTP server logs

**High spam rate:**
- Tune SPAM_SCORE_THRESHOLD
- Review spam filter rules
- Check spamassassin/dnsbl configuration

**Memory issues:**
- Increase Docker memory limits
- Optimize database queries
- Configure connection pooling

### Monitoring

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:8080/health

# View logs
docker logs email-backend
docker logs email-gateway

# Monitor performance
docker stats
```

### Backup & Recovery

```bash
# Backup database
docker exec email-db pg_dump -U emailserver emailserver_db > backup.sql

# Restore database
docker exec -i email-db psql -U emailserver emailserver_db < backup.sql
```

## Support & Contributing

For issues and contributions, please refer to the project repository and issue tracker.

---

**Version**: 1.0.0
**Last Updated**: 2024
