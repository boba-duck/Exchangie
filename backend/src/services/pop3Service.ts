import net from 'net';
import { config } from '@config/index';
import logger from '@utils/logger';

export const startPOP3Server = async () => {
  const server = net.createServer((socket) => {
    socket.write(`+OK ${config.hostname} POP3 Service Ready\r\n`);

    socket.on('data', (data) => {
      const line = data.toString().trim();
      const parts = line.split(' ');
      const command = parts[0].toUpperCase();

      // Simplified POP3 command handling
      switch (command) {
        case 'USER':
          socket.write('+OK User accepted\r\n');
          break;

        case 'PASS':
          socket.write('+OK Password accepted\r\n');
          break;

        case 'STAT':
          socket.write('+OK 0 0\r\n');
          break;

        case 'LIST':
          socket.write('+OK\r\n.\r\n');
          break;

        case 'RETR':
          socket.write('-ERR Message not found\r\n');
          break;

        case 'DELE':
          socket.write('+OK Marked for deletion\r\n');
          break;

        case 'QUIT':
          socket.write('+OK Pop server signing off\r\n');
          socket.end();
          break;

        default:
          socket.write('-ERR Unknown command\r\n');
      }
    });

    socket.on('error', (err) => {
      logger.error('POP3 socket error', err);
    });

    socket.on('end', () => {
      logger.info('POP3 client disconnected');
    });
  });

  server.listen(config.pop3.port, config.host, () => {
    logger.info(`POP3 server listening on ${config.host}:${config.pop3.port}`);
  });
};

export default { startPOP3Server };
