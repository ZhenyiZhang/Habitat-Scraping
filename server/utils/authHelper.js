import jwt from 'jsonwebtoken';
import config from '../config';
import passport from 'passport';

export const tokenForUser = (user) => {
	return jwt.sign({ sub: user._id }, config.auth.jwt.secret, { expiresIn: 720000 });
};

export const verifyToken = (token, cb) => {
	jwt.verify(token, config.auth.jwt.secret, cb);
};

export const passportAuth = (strategy, options, scope) => (req, res, next) =>
	passport.authenticate(strategy, scope,
		(err, user, info) => {
			if (err) {
				return next(err);
			}
			if (req.session.flashMessage) {
				return res.redirect('/user/account');
			}
			if (!user) {
				return res.status(401).json({
					message: info.message,
				});
			}
			req.user = user;
			next();
		},
		options)(req, res, next);