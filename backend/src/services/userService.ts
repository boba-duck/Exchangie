import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '@config/database';
import { config } from '@config/index';
import { User, Domain } from '@models/types';
import { ValidationError, NotFoundError, ConflictError, AuthenticationError } from '@utils/errors';
import logger from '@utils/logger';

export class UserService {
  async createUser(
    username: string,
    email: string,
    password: string,
    domainId: string,
    displayName?: string
  ): Promise<Omit<User, 'password_hash'>> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Check if user already exists
      const existing = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (existing.rows.length > 0) {
        throw new ConflictError('User already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await query(
        `INSERT INTO users 
        (username, email, password_hash, domain_id, display_name) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id, username, email, domain_id, display_name, is_admin, mailbox_quota_mb, is_active, created_at, updated_at`,
        [username, email, passwordHash, domainId, displayName || username]
      );

      const user = result.rows[0];

      // Create default mailboxes
      await this.createDefaultMailboxes(user.id);

      logger.info(`User created: ${email}`);
      return user;
    } catch (err) {
      logger.error('Error creating user', err);
      throw err;
    }
  }

  async authenticateUser(email: string, password: string): Promise<string> {
    try {
      const result = await query(
        'SELECT id, password_hash, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AuthenticationError('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new AuthenticationError('User account is inactive');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

      logger.info(`User authenticated: ${email}`);
      return token;
    } catch (err) {
      logger.error('Authentication error', err);
      throw err;
    }
  }

  async getUserById(id: string): Promise<User> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User> {
    const allowedFields = ['display_name', 'mailbox_quota_mb', 'is_active'];
    const updateEntries = Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    );

    if (updateEntries.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const setClause = updateEntries
      .map(([, ], idx) => `${this.camelToSnake(updateEntries[idx][0])} = $${idx + 1}`)
      .join(', ');
    const values = updateEntries.map(([, value]) => value);

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${updateEntries.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    logger.info(`User updated: ${id}`);
    return result.rows[0];
  }

  async deleteUser(id: string): Promise<void> {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    logger.info(`User deleted: ${id}`);
  }

  async createDefaultMailboxes(userId: string): Promise<void> {
    const mailboxTypes = ['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM'];

    for (const type of mailboxTypes) {
      await query(
        `INSERT INTO mailboxes (user_id, name, type) VALUES ($1, $2, $3)`,
        [userId, type, type]
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default new UserService();
