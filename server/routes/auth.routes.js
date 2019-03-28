import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as passport from '../services/passport';

const router = new Router();

router.route('/signup').post(
	authController.signup,
	authController.setToken,
	(req, res) => {
		const user = req.user;
		res.send({
			userName: user.profile.name,
		});
	},
);

router.route('/signin').post(
	passport.localSignin,
	authController.setToken,
	(req, res) => {
		const user = req.user;
		res.send({
			userName: user.profile.name,
		});
	},
);

router.route('/secret').get(
	authController.authenticateUser,
	(req, res) => res.send('This is a secret!'));

export default router;