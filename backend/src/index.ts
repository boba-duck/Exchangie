import { startServer } from './app';
import logger from '@utils/logger';
import { startSMTPServer } from '@services/smtpService';
import { startIMAPServer } from '@services/imapService';
import { startPOP3Server } from '@services/pop3Service';

const main = async () => {
  try {
    // Start Express server for admin/webmail API
    await startServer();

    // Start SMTP server
    if (process.env.ENABLE_SMTP !== 'false') {
      await startSMTPServer();
    }

    // Start IMAP server
    if (process.env.ENABLE_IMAP !== 'false') {
      await startIMAPServer();
    }

    // Start POP3 server
    if (process.env.ENABLE_POP3 !== 'false') {
      await startPOP3Server();
    }

    logger.info('All services started successfully');
  } catch (err) {
    logger.error('Failed to start application', err);
    process.exit(1);
  }
};

main();
