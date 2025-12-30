const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/workController');

router.get('/', auth, ctrl.getWorks);
router.post('/:userId', auth, ctrl.sendRequest);

module.exports = router;
