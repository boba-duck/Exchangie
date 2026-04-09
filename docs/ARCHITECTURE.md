# Architecture Documentation

## System Overview

The Email Exchange Competitor is a cloud-native, microservices-based email platform designed for enterprise deployment with high availability, scalability, and security.

## Architecture Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    External Clients                            ┃
┃         (Email Clients, Web Browsers, Mobile Apps)            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  API Gateway (Nginx)                           ┃
┃     SSL Termination, Load Balancing, Rate Limiting            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
          ↙              ↓            ↘              ↙
       HTTPS           HTTPS          HTTPS        HTTPS
        ↓               ↓              ↓            ↓
┌──────────────┐  ┌──────────────┐  ┌────────┐  ┌──────────┐
│   Backend    │  │   Gateway    │  │Frontend│  │  Admin   │
│ (SMTP,IMAP,  │  │ (Security    │  │        │  │Dashboard │
│  POP3,API)   │  │  Scanning)   │  │        │  │          │
└──────────────┘  └──────────────┘  └────────┘  └──────────┘
    ↙   ↓  ↘
  SMTP IMAP POP3

Service Discovery
   ↓  ↓  ↓  ↓
┌──────────────────────────────────────────────────────────────┐
┃              Service Mesh / Container Orchestration           ┃
┃              (Kubernetes / Docker Swarm)                      ┃
└──────────────────────────────────────────────────────────────┘
        ↓         ↓         ↓         ↓         ↓
    Message    User      Mailbox  Spam      Domain
    Queue      Service   Service  Filter    Service
               Cache     Storage  Engine    

        ↓                  ↓                  ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              Data Layer                             ┃
┃  ┌──────────────┐  ┌──────────┐  ┌────────┐      ┃
┃  │ PostgreSQL   │  │  Redis   │  │  S3    │      ┃
┃  │ (Messages,   │  │ (Cache,  │  │(Archive)      ┃
┃  │  Users,      │  │ Sessions)│  │        │      ┃
┃  │  Domains)    │  │          │  │        │      ┃
┃  └──────────────┘  └──────────┘  └────────┘      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Core Services

### 1. Backend Service (Port 3000)

**Responsibilities:**
- SMTP server (ports 25, 587, 465)
- IMAP server (ports 143, 993)
- POP3 server (ports 110, 995)
- User and mailbox management
- Message storage and retrieval
- Admin API endpoints

**Key Components:**
- `SMTPService`: Handles incoming/outgoing emails
- `IMAPService`: Provides message queries
- `POP3Service`: Legacy email access
- `UserService`: User CRUD operations
- `MessageService`: Message management
- `MailboxService`: Folder operations

**Database Models:**
```
users (id, email, password_hash, domain_id, ...)
mailboxes (id, user_id, name, type, ...)
messages (id, mailbox_id, sender, subject, ...)
message_attachments (id, message_id, filename, ...)
```

### 2. Gateway Service (Port 8080)

**Responsibilities:**
- Email content scanning
- Spam detection (ML + rule-based)
- Malware detection
- Phishing detection
- Email classification
- Quarantine management

**Processing Pipeline:**
```
Inbound Email
    ↓
Virus Scan
    ↓
Attachment Analysis
    ↓
URL Reputation Check
    ↓
Spam Filter (Bayesian + Rules)
    ↓
Phishing Detection
    ↓
Decision: Accept/Reject/Quarantine
```

### 3. Frontend Service (Port 3100)

**Responsibilities:**
- Webmail UI
- Message composition and management
- Contact management
- Calendar integration
- Settings and preferences

**Technology Stack:**
- React 18
- Vite (build tool)
- Zustand (state management)
- Tailwind CSS (styling)

### 4. Admin Dashboard (Port 3200)

**Responsibilities:**
- User and domain management
- Mail flow rule configuration
- System monitoring
- Audit log review
- Backup management
- Spam filter configuration

**Technology Stack:**
- React 18
- Recharts (visualizations)
- Tailwind CSS (styling)

## Data Layer

### PostgreSQL Database

**Primary Schema:**

```
Domain Management:
├── domains
│   ├── id, name, description
│   ├── max_users, max_mailbox_size_mb
│   ├── dkim_public/private_keys
│   ├── spf_record, dmarc_policy
│   └── is_active

User Management:
├── users
│   ├── id, email, password_hash
│   ├── domain_id, display_name
│   ├── mailbox_quota_mb, mailbox_used_mb
│   ├── is_admin, is_active
│   └── last_login, created_at

Message Storage:
├── mailboxes
│   ├── id, user_id, name, type
│   ├── message_count, unread_count
│   ├── total_size_bytes
│   └── created_at, updated_at

├── messages
│   ├── id, mailbox_id
│   ├── sender_address, sender_name
│   ├── recipient_addresses[]
│   ├── subject, body_html, body_text
│   ├── is_read, is_starred, is_archived
│   ├── thread_id, size_bytes
│   └── received_at, sent_at

├── message_attachments
│   ├── id, message_id
│   ├── filename, mime_type, size_bytes
│   ├── content_hash, is_scanned, is_safe
│   └── created_at

Spam Management:
├── spam_filters
│   ├── id, domain_id, user_id
│   ├── rule_type (SENDER, DOMAIN, KEYWORD, HEADER, IP)
│   ├── pattern, action, action_target
│   └── priority, is_active

├── safe_lists
│   ├── id, user_id
│   ├── sender_address, sender_domain
│   ├── list_type (WHITELIST, BLACKLIST)
│   └── created_at

Distribution:
├── distribution_lists
│   ├── id, domain_id
│   ├── name, email, description
│   ├── member_addresses[]
│   └── is_active

Mail Flow:
├── mail_flow_rules
│   ├── id, domain_id, name
│   ├── sender_filter, recipient_filter
│   ├── action, action_value
│   └── priority, is_active

Audit & Logging:
├── audit_logs
│   ├── id, admin_id
│   ├── action, resource_type, resource_id
│   ├── old_value, new_value (JSONB)
│   ├── status, error_message
│   └── created_at

Index Strategy:
├── users(email)
├── users(domain_id)
├── messages(mailbox_id)
├── messages(sender_address)
├── messages(thread_id)
├── spam_filters(domain_id)
└── audit_logs(created_at)
```

### Redis Cache

**Usage Patterns:**
```
Cache Keys:
├── user:{userId}:session -> Session data
├── user:{userId}:settings -> User settings
├── domain:{domainId}:config -> Domain config
├── spam:rules:{domainId} -> Cached filter rules
└── rate_limit:{ip} -> Rate limit counters

Queues:
├── email:inbound -> Incoming emails
├── email:outbound -> Outbound emails
├── spam:scan -> Emails to scan
└── archive:process -> Emails to archive
```

## API Architecture

### REST API Design

**Layers:**
```
Client
   ↓
API Gateway (Nginx)
   ↓
Express Middleware
  ├── Authentication
  ├── Authorization
  ├── Validation
  ├── Rate Limiting
  └── Logging
   ↓
Route Handlers
  ├── /api/users -> UserController
  ├── /api/messages -> MessageController
  ├── /api/mailboxes -> MailboxController
  ├── /api/domains -> DomainController (Admin)
  └── /api/admin -> AdminController
   ↓
Services
  ├── UserService
  ├── MessageService
  ├── SpamFilterService
  ├── AuditService
  └── ...
   ↓
Database Layer (Query Builder / ORM)
   ↓
PostgreSQL / Redis
```

## Email Protocol Implementation

### SMTP Flow

```
1. Client connects to port 25/587/465
2. Server responds with 220 greeting
3. Client sends EHLO/HELO
4. Server responds with capabilities
5. Optional: TLS negotiation
6. Optional: Authentication
7. MAIL FROM: <sender@domain>
8. RCPT TO: <recipient@domain>
9. DATA
10. Message transmission
11. QUIT
12. Server processes email:
    - Spam check
    - Virus scan
    - Route to recipient mailbox
    - Store in database
```

### IMAP Flow

```
1. Client connects to port 143/993
2. Server responds with OK
3. Client sends LOGIN
4. Server authenticates
5. Client selects mailbox (SELECT INBOX)
6. Server returns mailbox stats
7. Client requests messages
8. Server returns message metadata
9. Client can FETCH full message
10. Updates message flags
11. LOGOUT
```

### POP3 Flow

```
1. Client connects to port 110/995
2. Server enters AUTHORIZATION state
3. Client sends USER <username>
4. Client sends PASS <password>
5. Server enters TRANSACTION state
6. Client can LIST/RETR/DELE
7. Client QUIT
8. Server commits changes
```

## Security Architecture

```
External Request
   ↓
┌─────────────────────────┐
│ Firewall Rules          │
│ (IP whitelist/blacklist)│
└─────────────────────────┘
   ↓
┌─────────────────────────┐
│ Nginx (Reverse Proxy)   │
│ (SSL/TLS termination)   │
└─────────────────────────┘
   ↓
┌─────────────────────────┐
│ Rate Limiting           │
│ (per IP, per user)      │
└─────────────────────────┘
   ↓
┌─────────────────────────┐
│ Authentication          │
│ (JWT, Session)          │
└─────────────────────────┘
   ↓
┌─────────────────────────┐
│ Authorization (RBAC)    │
│ (Role-based access)     │
└─────────────────────────┘
   ↓
┌─────────────────────────┐
│ Input Validation        │
│ (Schema validation)     │
└─────────────────────────┘
   ↓
┌─────────────────────────┐
│ SQL Injection Prevention │
│ (Parameterized queries) │
└─────────────────────────┘
   ↓
Application Logic
   ↓
Audit Logging
```

## Deployment Architectures

### Development (Single Container)

```
┌─────────────────────────────────────────┐
│ Docker Container                        │
│ ├── Node.js (Backend + Gateway)        │
│ ├── PostgreSQL                          │
│ ├── Redis                               │
│ └── Nginx                               │
└─────────────────────────────────────────┘
```

### Production (Docker Compose)

```
┌─────────────────────────────────────────────────────┐
│ Docker Network                                      │
│ ├── postgres (1 instance)                          │
│ ├── redis (1 instance)                             │
│ ├── backend (2 instances, load balanced)           │
│ ├── gateway (2 instances, load balanced)           │
│ ├── frontend (1 instance)                          │
│ ├── admin-dashboard (1 instance)                   │
│ └── nginx (reverse proxy)                          │
└─────────────────────────────────────────────────────┘
```

### Enterprise (Kubernetes)

```
Kubernetes Cluster
├── Namespace: email-system
│   ├── Deployment: postgres (1 replicas)
│   ├── Deployment: redis (1 replicas)
│   ├── Deployment: backend (3 replicas, auto-scaling)
│   ├── Deployment: gateway (3 replicas, auto-scaling)
│   ├── Deployment: frontend (2 replicas)
│   ├── Deployment: admin-dashboard (2 replicas)
│   ├── Service: backend (LoadBalancer)
│   ├── Service: gateway (LoadBalancer)
│   ├── ConfigMap: email-config
│   ├── Secret: email-secrets
│   ├── PersistentVolume: postgres-storage
│   ├── Ingress: api routes
│   └── HPA: auto-scaling policies
```

## Performance Characteristics

### Database Optimization

```
Connection Pooling:
├── Min connections: 5
├── Max connections: 50
└── Connection timeout: 30s

Query Optimization:
├── Index on email lookups
├── Index on message searches
├── Timestamp indexes for archiving
└── Composite indexes for common filters

Caching:
├── User sessions: Redis TTL 24h
├── Domain configs: Redis TTL 1h
├── Filter rules: Redis TTL 30m
└── Message headers: Redis TTL 5m
```

### Scalability Strategy

```
Horizontal Scaling:
├── Backend instances
│   ├── Stateless design
│   ├── Sticky sessions via Redis
│   └── Load balancing round-robin
├── Gateway instances
│   ├── Stateless processing
│   └── Parallel spam scanning
└── Frontend/Admin
    ├── CDN for static files
    └── Client-side caching

Vertical Scaling:
├── Increase container memory
├── Increase CPU allocation
└── Increase database resources
```

## Disaster Recovery

### Disaster Recovery Plan

```
RPO (Recovery Point Objective): 1 hour
RTO (Recovery Time Objective): 4 hours

Backup Strategy:
├── Daily automated backups
├── Incremental backups every 6 hours
├── Redundant storage (3 copies)
└── Off-site replication

Recovery Procedures:
1. Detect failure
2. Restore from latest backup
3. Replay transaction logs
4. Verify data integrity
5. Bring services online
6. Resume operations
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2024
