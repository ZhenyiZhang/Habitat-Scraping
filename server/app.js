import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import morgan from 'morgan';

// Import required modules
import config from './config';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import scrapeRouter from './routes/scrape.routes';
import logger from './logger';
import './services/passport';

// Initialize express app
const app = express();

// Set port number
app.set('port', config.server.port);

// Set native promises as mongoose promise
mongoose.Promise = global.Promise;

// Connect to mongodb
if (process.env.NODE_ENV !== 'test') mongoose.connect(config.mongo.url);
mongoose.connection.on('connected', () => {
	logger.info('MongoDB connection established!');
});
mongoose.connection.on('error', () => {
	logger.error('MongoDB connection error. Please make sure MongoDB is running.');
	process.exit();
});

// Express configuration
app.set('view engine', 'ejs');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms',
	{ 'stream': logger.stream }));
app.use(express.static(__dirname + '/uploads'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Setup passport
app.use(passport.initialize());

// Print out worker information
app.use((req, res, next) => {
	const cluster = require('cluster');
	if (cluster.isWorker) logger.info(`Worker ${cluster.worker.id} received request`);
	next();
});

// Setup Cookie and Session
//const MongoStore = require('connect-mongo')(session);
app.use(cookieParser(config.cookie.secret));
// app.use(session({
// 	secret: config.session.secret,
// 	resave: true,
// 	saveUninitialized: true,
// 	store: new MongoStore({
// 		url: config.mongo.url,
// 		autoReconnect: true,
// 	}),
// }));

// Authentication routes
app.use('/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/', scrapeRouter);

export default app;


