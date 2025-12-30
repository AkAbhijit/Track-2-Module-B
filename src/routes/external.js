const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/externalController');

router.get('/weather', ctrl.getCurrentWeather);
router.get('/city', ctrl.getCurrentTraffic);
router.get('/price', ctrl.getDynamicPrice);

module.exports = router;
