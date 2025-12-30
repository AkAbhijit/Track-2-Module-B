const mongoose = require('mongoose');

const TariffSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['STATIC', 'DYNAMIC'],
        default: 'STATIC'
    },
    base_price: {
        type: Number,
        required: true
    },
    min_price: {
        type: Number,
        default: null
    },
    max_price: {
        type: Number,
        default: null
    },
    category_id: {
        type: String,
        required: true,
        ref: 'Category'
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, { timestamps: false });

module.exports = mongoose.model('Tariff', TariffSchema);
