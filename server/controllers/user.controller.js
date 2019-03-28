import User from '../models/user';

/**
 * GET Profile /user/profile
 */
export const getProfile = (req, res, next) => {
	const { user_id } = req.signedCookies;
	User.findOne({ '_id': user_id })
		.then((existingUser) => {
			if (!existingUser) return res.status(422).send({ error: 'User not found !' });
			const profile = existingUser.profile;
			const user = {
				name: profile.name,
				email: existingUser.email,
				age: profile.age,
				gender: profile.gender,
			};
			return res.status(200).send({ user });
		})
		.catch((err) => next(err));
};

/**
 * POST /user/profile
 */
export const updateProfile = (req, res, next) => {
	const { email, gender, name, age } = req.body;
	const { user_id } = req.signedCookies;

	User.findOne({ '_id': user_id })
		.then((existingUser) => {
			if (!existingUser) return res.status(422).send({ error: 'User not found !' });
			res.cookie('user_name', name, { signed: true });
			existingUser.email = email;
			existingUser.profile.age = age;
			existingUser.profile.name = name;
			existingUser.profile.gender = gender;
			return existingUser.save();
		})
		.then(() => res.send({ message: 'Successfully updated !' }))
		.catch((err) => next(err));
};

/**
 * GET /user/account
 */
export const getAccount = (req, res, next) => {
	const id = req.signedCookies.user_id;

	User.findOne({ '_id': id })
		.then((existingUser) => {
			if (!existingUser) return res.status(422).send({ error: 'User not found !' });
			const containPassword = typeof existingUser.password !== 'undefined';
			var linkedAccounts = {
				github: false,
				facebook: false,
				google: false,
			};
			if (existingUser.github && existingUser.github.id) linkedAccounts.github = true;
			if (existingUser.facebook && existingUser.facebook.id) linkedAccounts.facebook = true;
			if (existingUser.google && existingUser.google.id) linkedAccounts.google = true;
			const user = {
				containPassword,
				linkedAccounts,
			};
			return res.status(200).send({ user });
		})
		.catch((err) => next(err));
};

/**
 * POST /user/account
 */
export const updateAccount = (req, res, next) => {
	const { password, newPassword } = req.body;
	const id = req.signedCookies.user_id;

	User.findOne({ '_id': id })
		.then((existingUser) => {
			if (!existingUser) return res.status(422).send({ error: 'User not found !' });
			if (typeof existingUser.password === 'undefined') {
				existingUser.password = newPassword;
				existingUser.save(() => {
					res.send({ message: 'Successfully updated !' });
				});
			} else {
				existingUser.comparePassword(password, (err, isMatch) => {
					if (err) {
						return next(err);
					}
					if (!isMatch) {
						return res.status(422).send({ error: 'Incorrect password. Please try again !' });
					}
					existingUser.password = newPassword;
					existingUser.save(() => {
						res.send({ message: 'Successfully updated !' });
					});
				});
			}
		})
		.catch((err) => next(err));
};
