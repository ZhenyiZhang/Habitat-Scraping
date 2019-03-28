import User from '../models/user';
import { tokenForUser, verifyToken } from '../utils/authHelper';

export const authenticateUser = (req, res, next) => {
	const token = req.signedCookies.token;
	verifyToken(token, err => {
		if (err) {
			return res.status(401).json({
				title: 'Not Authenticated',
				error: err,
			});
		}
		next();
	});
};

export const signup = (req, res, next) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res.status(422).send({ error: 'Required field missing.' });
	}

	User.findOne({ 'local.email': email })
		.then((existingUser) => {
			if (existingUser) {
				return res.status(422).send({ error: 'Email in use.' });
			}
			const user = new User({
				email,
				password,
				profile: {
					name: username,
				},
			});
			return user.save();
		})
		.then((user) => {
			req.user = user;
			next();
		})
		.catch((err) => next(err));
};

export const setToken = (req, res, next) => {
	const user = req.user;
	const token = tokenForUser(user);
	res.cookie('token', token, { signed: true });
	res.cookie('user_name', user.profile.name, { signed: true });
	res.cookie('user_id', user._id.toString(), { signed: true });
	next();
};


