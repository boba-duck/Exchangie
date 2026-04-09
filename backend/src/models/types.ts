export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  domain_id: string;
  display_name: string;
  is_admin: boolean;
  mailbox_quota_mb: number;
  mailbox_used_mb: number;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  max_users: number;
  max_mailbox_size_mb: number;
  is_active: boolean;
  dkim_public_key?: string;
  dkim_private_key?: string;
  spf_record?: string;
  dmarc_policy?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Mailbox {
  id: string;
  user_id: string;
  name: string;
  type: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'CUSTOM';
  message_count: number;
  unread_count: number;
  total_size_bytes: number;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  mailbox_id: string;
  sender_address: string;
  sender_name?: string;
  recipient_addresses: string[];
  cc_addresses?: string[];
  bcc_addresses?: string[];
  subject: string;
  body_html?: string;
  body_text: string;
  original_message_id?: string;
  in_reply_to?: string;
  thread_id?: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  is_encrypted: boolean;
  has_attachments: boolean;
  size_bytes: number;
  received_at: Date;
  sent_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  content_hash: string;
  is_scanned: boolean;
  is_safe: boolean;
  created_at: Date;
}

export interface SpamFilter {
  id: string;
  domain_id: string;
  user_id?: string;
  rule_type: 'SENDER' | 'DOMAIN' | 'KEYWORD' | 'HEADER' | 'IP';
  pattern: string;
  action: 'DELETE' | 'QUARANTINE' | 'TAG' | 'FORWARD';
  action_target?: string;
  priority: number;
  is_active: boolean;
  created_at: Date;
}

export interface SafeList {
  id: string;
  user_id: string;
  sender_address: string;
  sender_domain?: string;
  list_type: 'WHITELIST' | 'BLACKLIST';
  created_at: Date;
}

export interface DistributionList {
  id: string;
  domain_id: string;
  name: string;
  email: string;
  description?: string;
  member_addresses: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MailFlow {
  id: string;
  domain_id: string;
  name: string;
  description?: string;
  priority: number;
  sender_filter?: string;
  recipient_filter?: string;
  action: 'ACCEPT' | 'REJECT' | 'REDIRECT' | 'ADD_HEADER' | 'REMOVE_HEADER';
  action_value?: string;
  is_active: boolean;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address: string;
  user_agent?: string;
  status: 'SUCCESS' | 'FAILURE';
  error_message?: string;
  created_at: Date;
}
