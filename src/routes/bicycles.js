const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/bicycleController');

router.get('/', ctrl.getBicycles);
router.get('/:bicycleId', ctrl.getBicycle);
router.post('/:bicycleId/repair', auth, ctrl.repairBicycle);
router.get('/:bicycleId/rentals', auth, ctrl.getBicycleBookings);
router.post('/:bicycleId/rentals/:rentalId/rate', auth, ctrl.rateBooking);

module.exports = router;
