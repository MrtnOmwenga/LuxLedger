import app from './server.js';
import config from './utils/config.utils.js';
import log from './utils/logger.utils.js';

app.listen(config.PORT, () => {
  log.info(`Server running on port ${config.PORT}`);
});