import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateUser } from '../controllers/auth.controller';

const router = new Router();

router.route('/profile').get(authenticateUser, userController.getProfile);
router.route('/profile').post(authenticateUser, userController.updateProfile);

router.route('/account').get(authenticateUser, userController.getAccount);
router.route('/account').post(authenticateUser, userController.updateAccount);

export default router;