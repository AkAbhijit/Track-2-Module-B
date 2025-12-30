const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount_percent: {
        type: Number,
        default: null
    },
    free_minutes: {
        type: Number,
        default: null
    },
    expires_at: {
        type: Date,
        required: true
    },
    category_id: {
        type: String,
        required: true,
        ref: 'Category'
    }
}, { timestamps: false });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
