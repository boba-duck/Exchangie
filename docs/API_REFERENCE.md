# Email Exchange Competitor - API Reference

## Base URLs

- **Backend API**: `http://localhost:3000/api`
- **Admin API**: `http://localhost:3001/api`
- **Gateway API**: `http://localhost:8080/api`

## Common Headers

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Server Error

## Authentication API

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "User Name",
    "is_admin": false
  },
  "expiresIn": "7d"
}
```

### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## User Management API

### Create User

```http
POST /users
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "securepass123",
  "domainId": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "john@example.com",
  "username": "john",
  "displayName": "John Doe",
  "is_admin": false,
  "mailbox_quota_mb": 10240,
  "is_active": true
}
```

### Get User Profile

```http
GET /users/profile
Authorization: Bearer <TOKEN>
```

### Update User

```http
PATCH /users/{userId}
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "mailbox_quota_mb": 20480
}
```

### List Users (Admin)

```http
GET /users?limit=50&offset=0
Authorization: Bearer <ADMIN_TOKEN>
```

**Response (200):**
```json
{
  "users": [...],
  "total": 1234,
  "limit": 50,
  "offset": 0
}
```

### Delete User

```http
DELETE /users/{userId}
Authorization: Bearer <ADMIN_TOKEN>
```

## Mailbox API

### Get Mailboxes

```http
GET /mailboxes
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "mailboxes": [
    {
      "id": "uuid",
      "name": "INBOX",
      "type": "INBOX",
      "message_count": 150,
      "unread_count": 5,
      "total_size_bytes": 5242880
    }
  ]
}
```

### Create Mailbox

```http
POST /mailboxes
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "Important",
  "type": "CUSTOM"
}
```

### Delete Mailbox

```http
DELETE /mailboxes/{mailboxId}
Authorization: Bearer <TOKEN>
```

## Message API

### Get Messages

```http
GET /mailboxes/{mailboxId}/messages?limit=50&offset=0
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "subject": "Meeting Tomorrow",
      "sender_address": "boss@company.com",
      "sender_name": "Boss",
      "recipient_addresses": ["user@example.com"],
      "is_read": false,
      "is_starred": true,
      "has_attachments": true,
      "received_at": "2024-01-15T10:30:00Z",
      "size_bytes": 1024
    }
  ],
  "total": 150
}
```

### Get Single Message

```http
GET /messages/{messageId}
Authorization: Bearer <TOKEN>
```

### Update Message

```http
PATCH /messages/{messageId}
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "is_read": true,
  "is_starred": false,
  "is_archived": false
}
```

### Delete Message

```http
DELETE /messages/{messageId}
Authorization: Bearer <TOKEN>
```

### Send Message

```http
POST /messages/send
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Subject Line",
  "body_text": "Email body",
  "body_html": "<p>Email body</p>"
}
```

### Get Attachments

```http
GET /messages/{messageId}/attachments
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "attachments": [
    {
      "id": "uuid",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 2048,
      "is_safe": true
    }
  ]
}
```

## Spam Filter API

### Create Filter Rule

```http
POST /spam-filters
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "domainId": "uuid",
  "ruleType": "SENDER",
  "pattern": "spam@badsite.com",
  "action": "DELETE",
  "priority": 10
}
```

**Rule Types:**
- `SENDER`: Exact sender email
- `DOMAIN`: Sender domain
- `KEYWORD`: Subject/body keyword
- `HEADER`: Email header pattern
- `IP`: Sender IP address

**Actions:**
- `DELETE`: Delete matching emails
- `QUARANTINE`: Move to quarantine
- `TAG`: Add tag (requires action_target)
- `FORWARD`: Forward to address (requires action_target)

### Get Filters

```http
GET /spam-filters
Authorization: Bearer <TOKEN>
```

### Delete Filter

```http
DELETE /spam-filters/{filterId}
Authorization: Bearer <TOKEN>
```

### Add to Safe List

```http
POST /safe-list
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "senderAddress": "trusted@example.com",
  "listType": "WHITELIST"
}
```

**List Types:**
- `WHITELIST`: Trust sender
- `BLACKLIST`: Block sender

## Domain API (Admin)

### Create Domain

```http
POST /domains
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "example.com",
  "description": "Main company domain",
  "max_users": 1000,
  "max_mailbox_size_mb": 10240
}
```

### Get Domains

```http
GET /domains
Authorization: Bearer <ADMIN_TOKEN>
```

### Update Domain

```http
PATCH /domains/{domainId}
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "dkim_public_key": "...",
  "spf_record": "v=spf1 mx ~all"
}
```

### Delete Domain

```http
DELETE /domains/{domainId}
Authorization: Bearer <ADMIN_TOKEN>
```

## Mail Flow Rules API (Admin)

### Create Rule

```http
POST /mail-flow-rules
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "domainId": "uuid",
  "name": "Block External",
  "sender_filter": "*@internal.com",
  "recipient_filter": "*@external.com",
  "action": "REJECT",
  "priority": 100
}
```

### Get Rules

```http
GET /mail-flow-rules
Authorization: Bearer <ADMIN_TOKEN>
```

### Delete Rule

```http
DELETE /mail-flow-rules/{ruleId}
Authorization: Bearer <ADMIN_TOKEN>
```

## Audit Log API (Admin)

### Get Audit Logs

```http
GET /audit-logs?limit=50&offset=0&resource_type=USER
Authorization: Bearer <ADMIN_TOKEN>
```

**Response (200):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "action": "CREATE",
      "resource_type": "USER",
      "resource_id": "uuid",
      "new_value": {"email": "user@example.com"},
      "status": "SUCCESS",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5000
}
```

## Gateway API

### Scan Inbound Email

```http
POST /api/inbound
Content-Type: application/json

{
  "email": {
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "body": "Email content"
  }
}
```

**Response (200):**
```json
{
  "status": "pass",
  "threats": [],
  "score": 0,
  "verdict": "clean"
}
```

### Classify Email

```http
POST /api/classify
Content-Type: application/json

{
  "email": {...}
}
```

**Response (200):**
```json
{
  "isSpam": false,
  "confidence": 0.95,
  "category": "legitimate",
  "reason": "Known sender"
}
```

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid input
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `INTERNAL_ERROR`: Server error

---

**API Version**: 1.0.0
**Last Updated**: 2024
