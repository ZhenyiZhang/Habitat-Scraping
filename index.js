import './env.js';
import http from 'http';
import logger from './server/logger';
import app from './server/app';

const server = http.createServer(app);

server.listen(app.get('port'), () => {
	logger.info(`App stated in ${app.get('env')} mode on port ${app.get('port')}`);
});