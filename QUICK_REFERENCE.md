# Developer Quick Reference

## Project Commands

```bash
# Installation
npm install                 # Install all dependencies
npm install -w backend      # Install workspace

# Development
npm run dev                 # Start all services
npm run dev -w backend      # Start specific workspace

# Building
npm run build               # Build all services
npm run build -w backend    # Build specific workspace

# Testing & Quality
npm test                    # Run all tests
npm run lint                # Lint all code
npm run typecheck           # Type check all code

# Docker
npm run docker:build        # Build Docker images
npm run docker:up           # Start Docker containers
npm run docker:down         # Stop Docker containers

# Database
npm run db:init             # Initialize database
npm run db:migrate          # Run migrations
```

## Service URLs (Development)

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3000 | Email server & REST API |
| Admin API | http://localhost:3001 | Admin endpoints |
| Gateway | http://localhost:8080 | Email security |
| Webmail | http://localhost:3100 | Email client |
| Admin Dashboard | http://localhost:3200 | Admin console |

## Email Protocol Ports

| Protocol | Port | Purpose |
|----------|------|---------|
| SMTP | 25 | Inbound email |
| SMTP TLS | 587 | Outbound email |
| SMTP SSL | 465 | Outbound email (legacy) |
| IMAP | 143 | Mail sync |
| IMAP SSL | 993 | Secure mail sync |
| POP3 | 110 | Legacy mail access |
| POP3 SSL | 995 | Secure mail access |

## Key Files & Directories

```
backend/src/
├── services/
│   ├── userService.ts        # User management
│   ├── messageService.ts     # Message storage
│   ├── spamFilterService.ts  # Spam detection
│   ├── smtpService.ts        # SMTP server
│   ├── imapService.ts        # IMAP server
│   └── pop3Service.ts        # POP3 server
├── config/
│   ├── index.ts              # Configuration
│   ├── database.ts           # PostgreSQL setup
│   └── redis.ts              # Redis setup
├── utils/
│   ├── logger.ts             # Logging
│   ├── errors.ts             # Error classes
│   ├── database-init.ts      # Database schemas
│   └── emailUtils.ts         # Email utilities
├── models/
│   └── types.ts              # TypeScript interfaces
├── app.ts                    # Express app setup
└── index.ts                  # Entry point
```

## Environment Variables (Key)

```env
# Server
NODE_ENV=development
BACKEND_PORT=3000

# Database
DB_HOST=localhost
DB_USER=emailserver
DB_PASSWORD=changeme

# Email Config
DOMAIN=example.com
HOSTNAME=mail.example.com
SMTP_PORT=25

# Security
TLS_ENABLED=true
JWT_SECRET=your-secret-key

# Spam Filter
SPAM_FILTER_ENABLED=true
ENABLE_ML_SPAM_DETECTION=true
```

## Database Schemas (Quick Reference)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  domain_id UUID NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ...
)

-- Domains
CREATE TABLE domains (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  max_users INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  ...
)

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  mailbox_id UUID NOT NULL,
  sender_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  received_at TIMESTAMP DEFAULT NOW(),
  ...
)
```

## API Examples

### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# Response
{
  "token": "eyJ...",
  "expiresIn": "7d"
}
```

### Users
```bash
# Create user
POST /api/users
Authorization: Bearer <token>
{ "username": "john", "email": "john@example.com", ... }

# Get user
GET /api/users/{userId}
Authorization: Bearer <token>

# Update user
PATCH /api/users/{userId}
Authorization: Bearer <token>

# Delete user
DELETE /api/users/{userId}
Authorization: Bearer <token>
```

### Messages
```bash
# List messages
GET /api/mailboxes/{mailboxId}/messages?limit=50&offset=0
Authorization: Bearer <token>

# Get message
GET /api/messages/{messageId}
Authorization: Bearer <token>

# Update message
PATCH /api/messages/{messageId}
Authorization: Bearer <token>
{ "is_read": true }

# Delete message
DELETE /api/messages/{messageId}
Authorization: Bearer <token>

# Send email
POST /api/messages/send
Authorization: Bearer <token>
{ "to": [...], "subject": "...", "body_text": "..." }
```

### Spam Filters
```bash
# Create filter
POST /api/spam-filters
Authorization: Bearer <token>
{
  "ruleType": "SENDER",
  "pattern": "spam@bad.com",
  "action": "DELETE"
}

# Get filters
GET /api/spam-filters
Authorization: Bearer <token>

# Delete filter
DELETE /api/spam-filters/{filterId}
Authorization: Bearer <token>
```

## Docker Commands

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f backend
docker-compose logs -f gateway

# Execute command
docker-compose exec backend npm run migrate
docker-compose exec postgres psql -U emailserver -d emailserver_db
```

## Debugging

### View Logs
```bash
# Docker logs
docker logs email-backend
docker logs email-gateway

# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# Docker compose logs
docker-compose logs -f
```

### Database Debugging
```bash
# Connect to DB
docker exec -it email-db psql -U emailserver -d emailserver_db

# Common queries
SELECT * FROM users;
SELECT * FROM messages LIMIT 10;
SELECT * FROM spam_filters WHERE domain_id = '...';
```

### Performance Profiling
```bash
# Monitor Docker containers
docker stats

# Check Node.js memory
docker exec email-backend node -e "console.log(require('os').freemem())"

# Monitor database
docker exec email-db psql -U emailserver -d emailserver_db -c "\l"
```

## Code Style

### TypeScript
```typescript
// Use interfaces for types
interface User {
  id: string;
  email: string;
  created_at: Date;
}

// Async/await for promises
async function getUser(id: string): Promise<User> {
  return await userService.getUserById(id);
}

// Error handling
try {
  // code
} catch (err) {
  logger.error('Error occurred', err);
  throw new APIError(500, 'Internal error');
}
```

### React Components
```typescript
import React from 'react';

export function MyComponent({ prop }: Props) {
  const [state, setState] = React.useState(null);
  
  React.useEffect(() => {
    // lifecycle
  }, []);
  
  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
}
```

## Useful Links

- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Express Docs**: https://expressjs.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/documentation
- **React Docs**: https://react.dev
- **Docker Docs**: https://docs.docker.com/
- **Kubernetes Docs**: https://kubernetes.io/docs/

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process
lsof -i :<port>

# Kill process
kill -9 <PID>

# Or change port in .env
```

### Database Connection Failed
```bash
# Check PostgreSQL
docker ps | grep postgres

# Check logs
docker logs email-db

# Restart
docker-compose restart postgres
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

### TypeScript Errors
```bash
# Type check
npm run typecheck

# Generate types
npm run build

# Check tsconfig.json
```

## Performance Tips

1. **Database**: Use indexes, limit queries, paginate results
2. **Caching**: Cache frequently accessed data in Redis
3. **API**: Use proper HTTP caching headers
4. **Frontend**: Code split, lazy load components
5. **Docker**: Use multi-stage builds, optimize images
6. **Monitoring**: Profile regularly, identify bottlenecks

## Security Checklist

- [ ] Use HTTPS/TLS in production
- [ ] Validate all inputs
- [ ] Use parameterized queries
- [ ] Hash passwords with bcrypt
- [ ] Implement rate limiting
- [ ] Use JWT for authentication
- [ ] Enable CORS properly
- [ ] Sanitize outputs
- [ ] Keep dependencies updated
- [ ] Review audit logs regularly

---

**Last Updated**: 2024
