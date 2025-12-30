const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tariffController');

router.get('/:bicycleId/tariffs', ctrl.getBicycleTariffs);
router.get('/:bicycleId/tariffs/:tariffId/price', ctrl.getCurrentPrice);

module.exports = router;
