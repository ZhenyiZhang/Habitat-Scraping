export default {
	cookie: {
		secret: process.env.COOKIE_SECRET,
	},
	session: {
		secret: process.env.SESSION_SECRET,
	},
	server: {
		host: process.env.SERVER_HOST,
		port: process.env.SERVER_PORT || 3000,
	},
	mongo: {
		url: 'mongodb://localhost:27017/authentication_DEV',
	},
	auth: {
		jwt: {
			secret: process.env.JWT_SECRET,
		},
	},
	log: {
		console: 'error',
		file: 'error',
		color: true,
	},
};