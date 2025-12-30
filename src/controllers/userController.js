const crypto = require('crypto');
const Bicycle = require('../models/bicycle');
const Booking = require('../models/booking');
const BalanceHistory = require('../models/balanceHistory');
const Tariff = require('../models/tariff');
const Category = require('../models/category');

async function getUser(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });
        return res.status(200).json({ data: { name: user.name, email: user.email, phone: user.phone, balance: user.balance } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function getMyBicycles(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });

        const categories = await Category.find({ user_id: user.id }).select('id');
        const categoryIds = categories.map(c => c.id);
        const bicycles = await Bicycle.find({ category_id: { $in: categoryIds } });

        const items = bicycles.map(b => ({ id: b.id, name: b.name, percentageOfWear: b.percentage_of_wear || b.percentageOfWear || 0, isOwner: true }));
        return res.status(200).json({ data: { items } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function getMyTransactions(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });

        const payments = await BalanceHistory.find({ user_id: user.id }).sort({ created_at: -1 });
        const formatted = payments.map(p => ({ type: p.type, value: p.value, createdAt: p.created_at }));
        return res.status(200).json({ balance: user.balance, payments: formatted });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function replenishment(req, res) {
    try {
        const user = req.user;
        const { amount } = req.body || {};
        if (typeof amount !== 'number' || isNaN(amount)) {
            return res.status(400).json({ message: ['amount must be a number'], error: 'Bad Request', statusCode: 400 });
        }
        if (amount > 100000) {
            return res.status(400).json({ message: ['amount must not be greater than 100000'], error: 'Bad Request', statusCode: 400 });
        }

        const id = crypto.randomUUID();
        await BalanceHistory.create({ id, type: 'REPLENISHMENT', value: amount, user_id: user.id });
        user.balance = (user.balance || 0) + amount;
        await user.save();
        return res.status(201).json({ data: { balance: user.balance } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function getCurrentRent(req, res) {
    try {
        const user = req.user;
        const booking = await Booking.findOne({ user_id: user.id, ended_at: null });
        if (!booking) return res.status(200).json({ data: null });

        const bicycle = await Bicycle.findOne({ id: booking.bicycle_id });
        return res.status(200).json({ data: { id: booking.id, pricePerMin: booking.price_per_min, startedAt: booking.started_at, bicycle: { name: bicycle?.name || '' } } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function rent(req, res) {
    try {
        const user = req.user;
        const { tariffId, bicycleId, promoCodeId } = req.body || {};
        if (!tariffId) return res.status(400).json({ message: ['tariffId should not be empty'], error: 'Bad Request', statusCode: 400 });

        const active = await Booking.findOne({ user_id: user.id, ended_at: null });
        if (active) return res.status(409).json({ message: "You're already renting a bike", error: 'Conflict', statusCode: 409 });

        const bicycle = await Bicycle.findOne({ id: bicycleId });
        if (!bicycle) return res.status(409).json({ message: 'The bike is not available', error: 'Conflict', statusCode: 409 });
        if (bicycle.status !== 'AVAILABLE') return res.status(409).json({ message: 'The bike is not available', error: 'Conflict', statusCode: 409 });

        const tariff = await Tariff.findOne({ id: tariffId });
        if (!tariff) return res.status(400).json({ message: 'Bad Request', statusCode: 400 });

        // cannot rent if wear >= 50
        if ((bicycle.percentage_of_wear || 0) >= 50) return res.status(409).json({ message: 'The bike is broken', error: 'Conflict', statusCode: 409 });

        // take deposit
        const deposit = 1000;
        if ((user.balance || 0) < deposit) return res.status(409).json({ message: 'There are not enough funds for insurance', error: 'Conflict', statusCode: 409 });
        user.balance = (user.balance || 0) - deposit;
        await BalanceHistory.create({ id: crypto.randomUUID(), type: 'WITHDRAWAL', value: deposit, user_id: user.id });
        await user.save();

        const id = crypto.randomUUID();
        await Booking.create({ id, price_per_min: tariff.base_price, full_price: null, rating: null, userRating: null, percentage_of_wear: null, started_at: new Date(), ended_at: null, bicycle_id: bicycle.id, tariff_id: tariff.id, user_id: user.id });
        bicycle.status = 'UNAVAILABLE';
        await bicycle.save();
        return res.status(204).send();
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function finish(req, res) {
    try {
        const user = req.user;
        const active = await Booking.findOne({ user_id: user.id, ended_at: null });
        if (!active) return res.status(403).json({ message: "Don't have an active bike rental", error: 'Conflict', statusCode: 403 });

        const { rating, photos } = req.body || {};
        if (!photos || !Array.isArray(photos) || photos.length < 2) {
            return res.status(400).json({ message: 'Bad Request', statusCode: 400 });
        }

        active.ended_at = new Date();
        active.photos = photos;
        if (typeof rating === 'number') active.userRating = rating;

        // calculate duration and cost
        const ms = new Date(active.ended_at).getTime() - new Date(active.started_at).getTime();
        const minutes = Math.ceil(ms / 60000);
        const cost = (active.price_per_min || 0) * minutes;

        // wear calculation
        const wear = Math.floor(((ms / 1000) / 60) * 0.1);

        // check if user can pay total rental cost (deposit was taken at start)
        if ((user.balance || 0) < cost) {
            // user cannot pay; do not refund deposit
            await active.save();
            return res.status(403).json({ message: 'There are not enough funds for payment', error: 'Conflict', statusCode: 403 });
        }

        // charge cost
        user.balance = (user.balance || 0) - cost;
        await BalanceHistory.create({ id: crypto.randomUUID(), type: 'RENTAL', value: cost, user_id: user.id });

        // refund deposit (1000)
        const deposit = 1000;
        user.balance = user.balance + deposit;
        await BalanceHistory.create({ id: crypto.randomUUID(), type: 'REPLENISHMENT', value: deposit, user_id: user.id });

        await user.save();

        // update bicycle wear and status
        const bicycle = await Bicycle.findOne({ id: active.bicycle_id });
        if (bicycle) {
            bicycle.percentage_of_wear = Math.min(100, (bicycle.percentage_of_wear || 0) + wear);
            bicycle.status = bicycle.percentage_of_wear >= 50 ? 'UNAVAILABLE' : 'AVAILABLE';
            await bicycle.save();
        }

        await active.save();
        return res.status(204).send();
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

async function getWork(req, res) {
    try {
        const user = req.user;
        const application = await require('../models/application').findOne({ user_id: user.id });
        if (!application) return res.status(200).json({ data: null });
        const category = await Category.findOne({ id: application.category_id });
        return res.status(200).json({ data: { id: application.id, name: category?.name || '', rating: application.rating || null, status: application.status } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

module.exports.getUser = getUser;
module.exports.getMyBicycles = getMyBicycles;
module.exports.getMyTransactions = getMyTransactions;
module.exports.replenishment = replenishment;
module.exports.getCurrentRent = getCurrentRent;
module.exports.rent = rent;
module.exports.finish = finish;
module.exports.getWork = getWork;
