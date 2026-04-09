import { query } from '@config/database';
import logger from '@utils/logger';

export interface ParsedEmail {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  textBody: string;
  htmlBody?: string;
  headers: Record<string, string>;
  attachments: Array<{
    filename: string;
    mimeType: string;
    data: Buffer;
  }>;
}

export async function parseEmail(rawEmail: Buffer): Promise<ParsedEmail> {
  // Simplified email parsing
  // In production, use mailparser or similar
  const content = rawEmail.toString();
  const [headerSection, ...bodyParts] = content.split('\r\n\r\n');

  const headers: Record<string, string> = {};
  const headerLines = headerSection.split('\r\n');

  for (const line of headerLines) {
    const [key, ...valueParts] = line.split(':');
    if (key) {
      headers[key.toLowerCase()] = valueParts.join(':').trim();
    }
  }

  const bodyText = bodyParts.join('\r\n\r\n');

  return {
    from: headers.from || '',
    to: parseAddressList(headers.to || ''),
    cc: parseAddressList(headers.cc || ''),
    bcc: parseAddressList(headers.bcc || ''),
    subject: headers.subject || '(No Subject)',
    textBody: bodyText,
    htmlBody: undefined,
    headers,
    attachments: [],
  };
}

export function parseAddressList(addresses: string): string[] {
  return addresses
    .split(',')
    .map((addr) => addr.trim())
    .filter((addr) => addr.length > 0);
}

export async function validateSender(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check if domain exists in our system
  const [localPart, domain] = email.split('@');
  const result = await query(
    'SELECT id FROM domains WHERE name = $1 AND is_active = true',
    [domain]
  );

  return result.rows.length > 0;
}

export async function expandDistributionList(email: string): Promise<string[]> {
  const result = await query(
    'SELECT member_addresses FROM distribution_lists WHERE email = $1 AND is_active = true',
    [email]
  );

  if (result.rows.length === 0) {
    return [];
  }

  return result.rows[0].member_addresses || [];
}

export async function getDomainIdByName(domainName: string): Promise<string | null> {
  const result = await query(
    'SELECT id FROM domains WHERE name = $1',
    [domainName]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function getUserByEmail(email: string): Promise<string | null> {
  const result = await query(
    'SELECT id FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function getMailboxByUserId(
  userId: string,
  mailboxType: string = 'INBOX'
): Promise<string | null> {
  const result = await query(
    'SELECT id FROM mailboxes WHERE user_id = $1 AND type = $2',
    [userId, mailboxType]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

export function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@localhost>`;
}

export function calculateMessageSize(email: ParsedEmail): number {
  let size = 0;
  size += email.from.length;
  size += email.to.join(',').length;
  size += email.subject.length;
  size += email.textBody.length;
  if (email.htmlBody) {
    size += email.htmlBody.length;
  }
  email.attachments.forEach((att) => {
    size += att.data.length;
  });
  return size;
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function extractDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : '';
}
