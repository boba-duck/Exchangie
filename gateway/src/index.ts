import app from './app';
import logger from './utils/logger';

const port = process.env.GATEWAY_PORT || 8080;

app.listen(port, () => {
  logger.info(`Email Gateway running on port ${port}`);
});
