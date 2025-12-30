const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    id: {
        type:
            String,
        required: true,
        unique: true
    },
    price_per_min: {
        type: Number,
        required: true
    },
    full_price: {
        type: Number,
        default: null
    },
    rating: {
        type: Number,
        default: null
    },
    userRating: {
        type: Number,
        default: null
    },
    percentage_of_wear: {
        type: Number,
        default: null
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    ended_at: {
        type: Date,
        default: null
    },
    bicycle_id: {
        type: String,
        required: true,
        ref: 'Bicycle'
    },
    tariff_id: {
        type: String,
        required: true,
        ref: 'Tariff'
    },
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    promo_code_id: {
        type: String,
        default: null,
        ref: 'PromoCode'
    },
    photos: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: false });

module.exports = mongoose.model('Booking', BookingSchema);
