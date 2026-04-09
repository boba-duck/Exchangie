import { query } from '@config/database';
import { config } from '@config/index';
import { SpamFilter, SafeList } from '@models/types';
import { NotFoundError, ValidationError } from '@utils/errors';
import logger from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SpamFilterService {
  async createFilter(
    domainId: string,
    userId: string | undefined,
    ruleType: string,
    pattern: string,
    action: string,
    actionTarget?: string,
    priority: number = 0
  ): Promise<SpamFilter> {
    try {
      const result = await query(
        `INSERT INTO spam_filters 
        (domain_id, user_id, rule_type, pattern, action, action_target, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [domainId, userId, ruleType, pattern, action, actionTarget, priority]
      );

      logger.info(`Spam filter created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error creating spam filter', err);
      throw err;
    }
  }

  async getFilters(domainId: string, userId?: string): Promise<SpamFilter[]> {
    let result;
    if (userId) {
      result = await query(
        `SELECT * FROM spam_filters 
         WHERE domain_id = $1 AND (user_id = $2 OR user_id IS NULL)
         ORDER BY priority DESC`,
        [domainId, userId]
      );
    } else {
      result = await query(
        `SELECT * FROM spam_filters WHERE domain_id = $1 ORDER BY priority DESC`,
        [domainId]
      );
    }

    return result.rows;
  }

  async deleteFilter(id: string): Promise<void> {
    const result = await query(
      'DELETE FROM spam_filters WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Filter not found');
    }

    logger.info(`Spam filter deleted: ${id}`);
  }

  async addToSafeList(
    userId: string,
    senderAddress: string,
    senderDomain: string | undefined,
    listType: 'WHITELIST' | 'BLACKLIST'
  ): Promise<SafeList> {
    const result = await query(
      `INSERT INTO safe_lists (user_id, sender_address, sender_domain, list_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, senderAddress, senderDomain, listType]
    );

    return result.rows[0];
  }

  async getSafeList(userId: string, listType?: string): Promise<SafeList[]> {
    let result;
    if (listType) {
      result = await query(
        'SELECT * FROM safe_lists WHERE user_id = $1 AND list_type = $2',
        [userId, listType]
      );
    } else {
      result = await query(
        'SELECT * FROM safe_lists WHERE user_id = $1',
        [userId]
      );
    }

    return result.rows;
  }

  async evaluateEmail(
    senderAddress: string,
    subject: string,
    bodyText: string,
    domainId: string,
    userId?: string
  ): Promise<{ isSpam: boolean; score: number; reason: string }> {
    try {
      let spamScore = 0;
      let reasons: string[] = [];

      // Get applicable filters
      const filters = await this.getFilters(domainId, userId);

      // Check against filters
      for (const filter of filters) {
        if (!filter.is_active) continue;

        const matched = this.matchFilter(filter, senderAddress, subject, bodyText);
        if (matched && filter.rule_type !== 'KEYWORD') {
          spamScore += filter.priority;
          reasons.push(`Matched rule: ${filter.pattern}`);
        }
      }

      // Check safe lists if user is specified
      if (userId) {
        const whiteList = await query(
          'SELECT * FROM safe_lists WHERE user_id = $1 AND list_type = $2',
          [userId, 'WHITELIST']
        );

        if (whiteList.rows.length > 0) {
          const isWhitelisted = whiteList.rows.some((item) =>
            senderAddress.toLowerCase().includes(item.sender_address.toLowerCase()) ||
            senderAddress.toLowerCase().endsWith(`@${item.sender_domain}`)
          );
          if (isWhitelisted) {
            spamScore = 0;
            reasons = ['sender is whitelisted'];
          }
        }
      }

      // Perform ML-based detection if enabled
      if (config.spamFilter.enableML) {
        const mlScore = await this.performSimpleMLDetection(subject, bodyText);
        spamScore += mlScore;
        if (mlScore > 0) {
          reasons.push(`ML detected potential spam (score: ${mlScore})`);
        }
      }

      const isSpam = spamScore >= config.spamFilter.scoreThreshold;

      return {
        isSpam,
        score: spamScore,
        reason: reasons.join('; '),
      };
    } catch (err) {
      logger.error('Error evaluating email', err);
      return { isSpam: false, score: 0, reason: 'Error during evaluation' };
    }
  }

  private matchFilter(
    filter: SpamFilter,
    senderAddress: string,
    subject: string,
    bodyText: string
  ): boolean {
    const pattern = filter.pattern.toLowerCase();

    switch (filter.rule_type) {
      case 'SENDER':
        return senderAddress.toLowerCase() === pattern;
      case 'DOMAIN':
        return senderAddress.toLowerCase().endsWith(`@${pattern}`);
      case 'KEYWORD':
        return subject.toLowerCase().includes(pattern) ||
               bodyText.toLowerCase().includes(pattern);
      case 'HEADER':
        // Simple header matching
        return subject.toLowerCase().includes(pattern);
      case 'IP':
        // IP matching would require sender IP info
        return false;
      default:
        return false;
    }
  }

  private async performSimpleMLDetection(
    subject: string,
    bodyText: string
  ): Promise<number> {
    // Simple heuristic-based spam detection
    let score = 0;

    // Check for common spam indicators
    const text = `${subject} ${bodyText}`.toLowerCase();

    const spamKeywords = [
      'click here', 'act now', 'urgent', 'confirm', 'verify',
      'congratulations', 'winner', 'claim', 'free', 'limited time',
      'viagra', 'casino', 'lottery', 'inheritance'
    ];

    for (const keyword of spamKeywords) {
      if (text.includes(keyword)) {
        score += 0.5;
      }
    }

    // Check for multiple exclamation marks
    if ((subject.match(/!/g) || []).length > 2) {
      score += 1;
    }

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlPattern) || [];
    if (urls.length > 3) {
      score += 2;
    }

    // Check for all caps
    const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
    if (capsRatio > 0.5) {
      score += 1;
    }

    return Math.min(score, 5);
  }
}

export default new SpamFilterService();
