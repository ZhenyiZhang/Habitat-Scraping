import passport from 'passport';
import { passportAuth } from '../utils/authHelper';
import LocalStrategy from 'passport-local';
import User from '../models/user';

// Local strategy
const localOptions = {
	usernameField: 'email',
};

const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
	User.findOne({ 'email': email })
		.then((existingUser) => {
			if (!existingUser) return done(null, false, { message: 'The email address does not exits.' });
			existingUser.comparePassword(password, (err, isMatch) => {
				if (err) {
					return done(err);
				}
				if (!isMatch) {
					return done(null, false, { message: 'Incorrect password.' });
				}
				return done(null, existingUser);
			});
		})
		.catch((err) => done(err));
});

// Use strategies
passport.use(localLogin);

export const localSignin = passportAuth('local', { session: false });
