import winston from 'winston';
import config from './config';

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			level: config.log.console,
			colorize: config.log.color,
		}),
		new (winston.transports.File)({
			filename: 'error.log',
			level: config.log.file,
		}),
	],
	exitOnError: false,
});

logger.stream = {
	write(message, encoding) {
		logger.info(message);
	},
};

export default logger;