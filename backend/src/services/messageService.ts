import { query } from '@config/database';
import { Message, MessageAttachment } from '@models/types';
import { NotFoundError, ValidationError } from '@utils/errors';
import logger from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class MessageService {
  async storeMessage(
    mailboxId: string,
    message: Partial<Message>
  ): Promise<Message> {
    try {
      const messageId = uuidv4();
      const threadId = message.thread_id || uuidv4();

      const result = await query(
        `INSERT INTO messages 
        (id, mailbox_id, sender_address, sender_name, recipient_addresses, 
         cc_addresses, bcc_addresses, subject, body_html, body_text, 
         original_message_id, in_reply_to, thread_id, has_attachments, 
         size_bytes, received_at, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          messageId,
          mailboxId,
          message.sender_address,
          message.sender_name,
          message.recipient_addresses || [],
          message.cc_addresses || [],
          message.bcc_addresses || [],
          message.subject,
          message.body_html,
          message.body_text,
          message.original_message_id,
          message.in_reply_to,
          threadId,
          message.has_attachments || false,
          message.size_bytes || 0,
          message.received_at || new Date(),
          message.sent_at || new Date(),
        ]
      );

      // Update mailbox stats
      await this.updateMailboxStats(mailboxId);

      logger.info(`Message stored: ${messageId}`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error storing message', err);
      throw err;
    }
  }

  async getMessage(id: string): Promise<Message> {
    const result = await query(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    return result.rows[0];
  }

  async getMessagesByMailbox(
    mailboxId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    const messagesResult = await query(
      `SELECT * FROM messages WHERE mailbox_id = $1 
       ORDER BY received_at DESC LIMIT $2 OFFSET $3`,
      [mailboxId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as count FROM messages WHERE mailbox_id = $1',
      [mailboxId]
    );

    return {
      messages: messagesResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async getMessagesByThread(threadId: string): Promise<Message[]> {
    const result = await query(
      'SELECT * FROM messages WHERE thread_id = $1 ORDER BY sent_at ASC',
      [threadId]
    );

    return result.rows;
  }

  async updateMessageFlags(
    id: string,
    flags: {
      is_read?: boolean;
      is_starred?: boolean;
      is_archived?: boolean;
    }
  ): Promise<Message> {
    const updates = Object.entries(flags)
      .filter(([, value]) => value !== undefined)
      .map(([key, value], idx) => `${key} = $${idx + 1}`)
      .join(', ');

    if (!updates) {
      throw new ValidationError('No flags to update');
    }

    const values = Object.entries(flags)
      .filter(([, value]) => value !== undefined)
      .map(([, value]) => value);

    const result = await query(
      `UPDATE messages SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    return result.rows[0];
  }

  async deleteMessage(id: string): Promise<void> {
    const result = await query(
      'DELETE FROM messages WHERE id = $1 RETURNING mailbox_id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    // Update mailbox stats
    await this.updateMailboxStats(result.rows[0].mailbox_id);
  }

  async addAttachment(
    messageId: string,
    attachment: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      contentHash: string;
    }
  ): Promise<MessageAttachment> {
    const result = await query(
      `INSERT INTO message_attachments 
      (message_id, filename, mime_type, size_bytes, content_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        messageId,
        attachment.filename,
        attachment.mimeType,
        attachment.sizeBytes,
        attachment.contentHash,
      ]
    );

    return result.rows[0];
  }

  async getAttachments(messageId: string): Promise<MessageAttachment[]> {
    const result = await query(
      'SELECT * FROM message_attachments WHERE message_id = $1',
      [messageId]
    );

    return result.rows;
  }

  async searchMessages(
    mailboxId: string,
    query_str: string,
    limit: number = 50
  ): Promise<Message[]> {
    const searchQuery = `%${query_str}%`;

    const result = await query(
      `SELECT * FROM messages 
       WHERE mailbox_id = $1 AND (subject ILIKE $2 OR body_text ILIKE $2 OR sender_address ILIKE $2)
       ORDER BY received_at DESC
       LIMIT $3`,
      [mailboxId, searchQuery, limit]
    );

    return result.rows;
  }

  private async updateMailboxStats(mailboxId: string): Promise<void> {
    await query(
      `UPDATE mailboxes SET 
       message_count = (SELECT COUNT(*) FROM messages WHERE mailbox_id = $1),
       unread_count = (SELECT COUNT(*) FROM messages WHERE mailbox_id = $1 AND is_read = false),
       total_size_bytes = (SELECT COALESCE(SUM(size_bytes), 0) FROM messages WHERE mailbox_id = $1),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [mailboxId]
    );
  }
}

export default new MessageService();
