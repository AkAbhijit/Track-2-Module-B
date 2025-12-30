const mongoose = require('mongoose');

const BicycleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: null
    },
    percentage_of_wear: {
        type: Number,
        required: true,
        default: 0
    },
    location_x: {
        type: String,
        required: true
    },
    location_y: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'UNAVAILABLE'],
        default: 'AVAILABLE'
    },
    path_to_image: {
        type: String,
        required: true
    },
    category_id: {
        type: String,
        required: true,
        ref: 'Category'
    }
}, { timestamps: false });

module.exports = mongoose.model('Bicycle', BicycleSchema);
