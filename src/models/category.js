const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    rent_conditions: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    }
}, { timestamps: false });

module.exports = mongoose.model('Category', CategorySchema);
