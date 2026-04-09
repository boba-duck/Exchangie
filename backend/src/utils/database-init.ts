import { query } from '@config/database';
import logger from '@utils/logger';

export const initializeDatabase = async () => {
  try {
    logger.info('Initializing database...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        domain_id UUID NOT NULL,
        display_name VARCHAR(255),
        is_admin BOOLEAN DEFAULT false,
        mailbox_quota_mb INTEGER DEFAULT 10240,
        mailbox_used_mb INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Domains table
    await query(`
      CREATE TABLE IF NOT EXISTS domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        max_users INTEGER DEFAULT 1000,
        max_mailbox_size_mb INTEGER DEFAULT 10240,
        is_active BOOLEAN DEFAULT true,
        dkim_public_key TEXT,
        dkim_private_key TEXT,
        spf_record VARCHAR(255),
        dmarc_policy VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mailboxes table
    await query(`
      CREATE TABLE IF NOT EXISTS mailboxes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'CUSTOM',
        message_count INTEGER DEFAULT 0,
        unread_count INTEGER DEFAULT 0,
        total_size_bytes BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
        sender_address VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255),
        recipient_addresses TEXT[] NOT NULL,
        cc_addresses TEXT[],
        bcc_addresses TEXT[],
        subject VARCHAR(500),
        body_html TEXT,
        body_text TEXT NOT NULL,
        original_message_id VARCHAR(255),
        in_reply_to VARCHAR(255),
        thread_id UUID,
        is_read BOOLEAN DEFAULT false,
        is_starred BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        is_encrypted BOOLEAN DEFAULT false,
        has_attachments BOOLEAN DEFAULT false,
        size_bytes BIGINT NOT NULL,
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Message attachments table
    await query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size_bytes BIGINT NOT NULL,
        content_hash VARCHAR(64),
        is_scanned BOOLEAN DEFAULT false,
        is_safe BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Spam filters table
    await query(`
      CREATE TABLE IF NOT EXISTS spam_filters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rule_type VARCHAR(50) NOT NULL,
        pattern TEXT NOT NULL,
        action VARCHAR(50) NOT NULL,
        action_target VARCHAR(255),
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safe lists table
    await query(`
      CREATE TABLE IF NOT EXISTS safe_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_address VARCHAR(255) NOT NULL,
        sender_domain VARCHAR(255),
        list_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Distribution lists table
    await query(`
      CREATE TABLE IF NOT EXISTS distribution_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        member_addresses TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mail flow rules table
    await query(`
      CREATE TABLE IF NOT EXISTS mail_flow_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        priority INTEGER DEFAULT 0,
        sender_filter VARCHAR(255),
        recipient_filter VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        action_value VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_mailbox ON messages(mailbox_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_address)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_spam_filters_domain ON spam_filters(domain_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)`);

    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Database initialization failed', err);
    throw err;
  }
};

export default initializeDatabase;
