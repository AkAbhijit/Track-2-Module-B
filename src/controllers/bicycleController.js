const Bicycle = require('../models/bicycle');
const Booking = require('../models/booking');
const Category = require('../models/category');

async function getBicycles(req, res) {
  try {
    const bikes = await Bicycle.find();
    const items = bikes.map(b => ({ id: b.id, slug: b.slug, locationX: b.location_x, locationY: b.location_y, status: b.status }));
    return res.status(200).json({ data: { items } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getBicycle(req, res) {
  try {
    const { bicycleId } = req.params;
    const b = await Bicycle.findOne({ id: bicycleId });
    if (!b) return res.status(404).json({ message: 'Bicycle not found', error: 'Not Found', statusCode: 404 });

    // compute weighted rating where newer ratings have stronger impact
    const bookings = await Booking.find({ bicycle_id: b.id, userRating: { $ne: null } }).sort({ started_at: 1 });
    let rating = null;
    if (bookings.length) {
      const alpha = 5;
      let current = 5; // starting baseline
      bookings.forEach(bk => {
        const r = Number(bk.userRating);
        if (!isNaN(r)) {
          current = (current * alpha + r) / (alpha + 1);
        }
      });
      rating = Math.round(current * 10) / 10;
    }

    return res.status(200).json({ data: { name: b.name, description: b.description, percentageOfWear: b.percentage_of_wear, pathToImage: b.path_to_image, rating } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function repairBicycle(req, res) {
  try {
    const { bicycleId } = req.params;
    const { type } = req.body || {};
    const allowed = ['wash', 'repair', 'tires', 'chain'];
    if (!allowed.includes(type)) return res.status(400).json({ message: ['type must be one of the following values: wash, repair, tires, chain'], error: 'Bad Request', statusCode: 400 });

    const bike = await Bicycle.findOne({ id: bicycleId });
    if (!bike) return res.status(404).json({ message: 'Bicycle not found', error: 'Not Found', statusCode: 404 });

    // only administrator can perform repairs
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!req.user || req.user.email !== adminEmail) {
      return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });
    }

    // apply service effects (simple mapping)
    const services = {
      wash: 10,
      repair: 25,
      tires: 35,
      chain: 30
    };
    const reduce = services[type] || 0;
    bike.percentage_of_wear = Math.max(0, bike.percentage_of_wear - reduce);
    if (bike.percentage_of_wear < 50) bike.status = 'AVAILABLE';
    await bike.save();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getBicycleBookings(req, res) {
  try {
    const { bicycleId } = req.params;
    const bike = await Bicycle.findOne({ id: bicycleId });
    if (!bike) return res.status(404).json({ message: 'Bicycle not found', error: 'Not Found', statusCode: 404 });

    const bookings = await Booking.find({ bicycle_id: bicycleId });
    const items = bookings.map(b => ({ id: b.id, percentageOfWear: b.percentage_of_wear, photos: Array.isArray(b.photos) ? b.photos : [] }));
    return res.status(200).json({ data: { items } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function rateBooking(req, res) {
  try {
    const { bicycleId, rentalId } = req.params;
    const { rating } = req.body || {};
    const booking = await Booking.findOne({ id: rentalId, bicycle_id: bicycleId });
    if (!booking) return res.status(404).json({ message: 'Rental not found', error: 'Not Found', statusCode: 404 });

    if (!booking.ended_at) return res.status(403).json({ message: 'The rent is not finished', error: 'Forbidden', statusCode: 403 });

    // allow renter to set rating (userRating)
    booking.userRating = rating;
    await booking.save();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getBicycles, getBicycle, repairBicycle, getBicycleBookings, rateBooking };
