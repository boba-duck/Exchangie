import net from 'net';
import { config } from '@config/index';
import logger from '@utils/logger';

export const startIMAPServer = async () => {
  const server = net.createServer((socket) => {
    socket.write(
      `* OK ${config.hostname} IMAP4rev1 Service Ready\r\n`
    );

    socket.on('data', (data) => {
      const line = data.toString().trim();
      const parts = line.split(' ');
      const tag = parts[0];
      const command = parts[1]?.toUpperCase();

      // Simplified IMAP command handling
      switch (command) {
        case 'CAPABILITY':
          socket.write(
            `* CAPABILITY IMAP4rev1 AUTH=LOGIN STARTTLS\r\n` +
            `${tag} OK CAPABILITY completed\r\n`
          );
          break;

        case 'LOGIN':
          // Simplified - real implementation would validate credentials
          socket.write(`${tag} OK LOGIN completed\r\n`);
          break;

        case 'SELECT':
          socket.write(
            `* 0 EXISTS\r\n` +
            `* 0 RECENT\r\n` +
            `* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n` +
            `${tag} OK SELECT completed\r\n`
          );
          break;

        case 'FETCH':
          socket.write(`${tag} OK FETCH completed\r\n`);
          break;

        case 'LOGOUT':
          socket.write(
            `* BYE ${config.hostname} IMAP4rev1 Server logging out\r\n` +
            `${tag} OK LOGOUT completed\r\n`
          );
          socket.end();
          break;

        default:
          socket.write(`${tag} BAD Unknown command\r\n`);
      }
    });

    socket.on('error', (err) => {
      logger.error('IMAP socket error', err);
    });

    socket.on('end', () => {
      logger.info('IMAP client disconnected');
    });
  });

  server.listen(config.imap.port, config.host, () => {
    logger.info(`IMAP server listening on ${config.host}:${config.imap.port}`);
  });
};

export default { startIMAPServer };
