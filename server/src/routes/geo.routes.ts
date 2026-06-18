import { Router } from '../lib/http/index.js';
import { reverseGeocodeHandler } from '../modules/geo/geo.controller.js';

const router = new Router();

router.get('/geo/reverse', reverseGeocodeHandler);

export default router;
