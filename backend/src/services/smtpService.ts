import net from 'net';
import tls from 'tls';
import fs from 'fs';
import { config } from '@config/index';
import logger from '@utils/logger';
import { parseEmail, validateSender, expandDistributionList } from '@utils/emailUtils';
import spamFilterService from '@services/spamFilterService';
import messageService from '@services/messageService';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

interface SMTPConnection {
  socket: net.Socket | tls.TLSSocket;
  authenticated: boolean;
  userId?: string;
  mailFrom?: string;
  rcptTo: string[];
  data?: Buffer;
}

const connections = new Map<net.Socket, SMTPConnection>();

export const startSMTPServer = async () => {
  const server = net.createServer();

  server.on('connection', (socket) => {
    const connection: SMTPConnection = {
      socket,
      authenticated: false,
      rcptTo: [],
    };

    connections.set(socket, connection);

    // Send greeting
    socket.write(`220 ${config.hostname} ESMTP Service Ready\r\n`);

    socket.on('data', async (data) => {
      try {
        const line = data.toString().trim();
        await handleSMTPCommand(connection, line);
      } catch (err) {
        logger.error('SMTP error', err);
        connection.socket.write('500 Internal Server Error\r\n');
      }
    });

    socket.on('end', () => {
      connections.delete(socket);
      logger.info('SMTP client disconnected');
    });

    socket.on('error', (err) => {
      logger.error('SMTP socket error', err);
      connections.delete(socket);
    });
  });

  server.listen(config.smtp.port, config.host, () => {
    logger.info(`SMTP server listening on ${config.host}:${config.smtp.port}`);
  });

  // Start SMTP with TLS
  if (config.tls.enabled) {
    const tlsServer = tls.createServer(
      {
        cert: fs.readFileSync(config.tls.certPath),
        key: fs.readFileSync(config.tls.keyPath),
      },
      (socket) => {
        const connection: SMTPConnection = {
          socket,
          authenticated: false,
          rcptTo: [],
        };

        connections.set(socket, connection);
        socket.write(`220 ${config.hostname} ESMTP Service Ready\r\n`);

        socket.on('data', async (data) => {
          try {
            const line = data.toString().trim();
            await handleSMTPCommand(connection, line);
          } catch (err) {
            logger.error('SMTP TLS error', err);
            connection.socket.write('500 Internal Server Error\r\n');
          }
        });

        socket.on('end', () => {
          connections.delete(socket);
        });

        socket.on('error', (err) => {
          logger.error('SMTP TLS socket error', err);
          connections.delete(socket);
        });
      }
    );

    tlsServer.listen(config.smtp.tlsPort, config.host, () => {
      logger.info(`SMTP TLS server listening on ${config.host}:${config.smtp.tlsPort}`);
    });
  }
};

async function handleSMTPCommand(connection: SMTPConnection, line: string) {
  const parts = line.split(' ');
  const command = parts[0].toUpperCase();
  const args = parts.slice(1).join(' ');

  switch (command) {
    case 'EHLO':
      connection.socket.write(
        `250-${config.hostname}\r\n` +
        `250-AUTH LOGIN\r\n` +
        `250-STARTTLS\r\n` +
        `250-SIZE 52428800\r\n` +
        `250 OK\r\n`
      );
      break;

    case 'HELO':
      connection.socket.write(`250 ${config.hostname}\r\n`);
      break;

    case 'AUTH':
      // Simplified auth handling
      if (args.toUpperCase().startsWith('LOGIN')) {
        connection.socket.write('334 VXNlcm5hbWU6\r\n'); // "Username:" in base64
      }
      break;

    case 'MAIL':
      const fromMatch = args.match(/FROM:<(.+?)>/i);
      if (fromMatch) {
        connection.mailFrom = fromMatch[1];
        connection.socket.write('250 OK\r\n');
      } else {
        connection.socket.write('501 Invalid syntax\r\n');
      }
      break;

    case 'RCPT':
      const toMatch = args.match(/TO:<(.+?)>/i);
      if (toMatch) {
        connection.rcptTo.push(toMatch[1]);
        connection.socket.write('250 OK\r\n');
      } else {
        connection.socket.write('501 Invalid syntax\r\n');
      }
      break;

    case 'DATA':
      connection.socket.write('354 Start mail input; end with <CRLF>.<CRLF>\r\n');
      connection.data = Buffer.alloc(0);

      // This is simplified - real SMTP would need better state handling
      break;

    case 'QUIT':
      connection.socket.write('221 Bye\r\n');
      connection.socket.end();
      break;

    case 'RSET':
      connection.mailFrom = '';
      connection.rcptTo = [];
      connection.data = undefined;
      connection.socket.write('250 OK\r\n');
      break;

    default:
      connection.socket.write('500 Unknown command\r\n');
  }
}

export default { startSMTPServer };
