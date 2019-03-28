import { Router } from 'express';
import * as scrapeController from '../controllers/scrape.controller';

const router = new Router();

router.route('/scrape').get(scrapeController.scrapePage);
router.route('/scrape/uwfeds').get(scrapeController.scrapeUWFeds);

export default router;