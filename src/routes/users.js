const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/userController');

router.get('/me', auth, controller.getUser);
router.get('/me/bicycles', auth, controller.getMyBicycles);
router.get('/me/transactions', auth, controller.getMyTransactions);
router.post('/me/transactions', auth, controller.replenishment);
router.get('/me/rental', auth, controller.getCurrentRent);
router.post('/me/rental', auth, controller.rent);
router.post('/me/rental/complete', auth, controller.finish);
router.get('/me/work', auth, controller.getWork);

module.exports = router;
