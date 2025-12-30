const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/historyController');

router.get('/', ctrl.getHistories);

module.exports = router;
