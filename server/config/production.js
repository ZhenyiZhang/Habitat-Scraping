export default {
	cookie: {
		secret: process.env.COOKIE_SECRET,
	},
	session: {
		secret: process.env.SESSION_SECRET,
	},
	server: {
		host: process.env.SERVER_HOST || 'localhost',
		port: process.env.PORT || process.env.SERVER_PORT,
	},
	mongo: {
		url: 'mongodb://localhost:27017/authentication_PROD',
	},
	auth: {
		jwt: {
			secret: process.env.JWT_SECRET,
		},
	},
	log: {
		console: 'error',
		file: 'error',
		color: false,
	},
};