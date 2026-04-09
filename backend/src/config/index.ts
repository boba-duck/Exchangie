import dotenv from 'dotenv';

dotenv.config();

export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BACKEND_PORT || '3000', 10),
  host: process.env.BACKEND_HOST || '0.0.0.0',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'emailserver',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'emailserver_db',
    ssl: process.env.DB_SSL === 'true',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Email Protocols
  smtp: {
    port: parseInt(process.env.SMTP_PORT || '25', 10),
    tlsPort: parseInt(process.env.SMTP_TLS_PORT || '587', 10),
    sslPort: parseInt(process.env.SMTP_SSL_PORT || '465', 10),
  },
  
  imap: {
    port: parseInt(process.env.IMAP_PORT || '143', 10),
    sslPort: parseInt(process.env.IMAP_SSL_PORT || '993', 10),
  },
  
  pop3: {
    port: parseInt(process.env.POP3_PORT || '110', 10),
    sslPort: parseInt(process.env.POP3_SSL_PORT || '995', 10),
  },

  // Server Configuration
  hostname: process.env.HOSTNAME || 'mail.example.com',
  domain: process.env.DOMAIN || 'example.com',
  primaryDomain: process.env.PRIMARY_DOMAIN || 'example.com',

  // Admin
  adminApiPort: parseInt(process.env.ADMIN_API_PORT || '3001', 10),
  adminApiKey: process.env.ADMIN_API_KEY,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // Gateway
  gateway: {
    enabled: process.env.GATEWAY_ENABLED === 'true',
    port: parseInt(process.env.GATEWAY_PORT || '8080', 10),
    hostname: process.env.GATEWAY_HOSTNAME || 'filter.example.com',
  },

  // TLS/SSL
  tls: {
    enabled: process.env.TLS_ENABLED === 'true',
    certPath: process.env.TLS_CERT_PATH || '/certs/server.crt',
    keyPath: process.env.TLS_KEY_PATH || '/certs/server.key',
  },

  // Spam Filter
  spamFilter: {
    enabled: process.env.SPAM_FILTER_ENABLED === 'true',
    scoreThreshold: parseFloat(process.env.SPAM_SCORE_THRESHOLD || '5.0'),
    enableML: process.env.ENABLE_ML_SPAM_DETECTION === 'true',
  },

  // Security
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Email Security
  emailSecurity: {
    enableDKIM: process.env.ENABLE_DKIM_SIGNING === 'true',
    enableSPF: process.env.ENABLE_SPF_CHECK === 'true',
    enableDMARC: process.env.ENABLE_DMARC_COMPLIANCE === 'true',
  },

  // Archiving
  archiving: {
    enabled: process.env.EMAIL_ARCHIVING_ENABLED === 'true',
    retentionDays: parseInt(process.env.ARCHIVE_RETENTION_DAYS || '2555', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

export default config;
