import { Router } from '../lib/http/index.js';
import {
  reverseGeocodeHandler,
  searchPlacesHandler,
  suggestPlacesHandler,
} from '../modules/geo/geo.controller.js';

const router = new Router();

router.get('/geo/reverse', reverseGeocodeHandler);
router.get('/geo/search', searchPlacesHandler);
router.get('/geo/suggest', suggestPlacesHandler);

export default router;
