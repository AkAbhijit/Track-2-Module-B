const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'CANCELED'],
        default: 'PENDING',
    },
    category_id: {
        type: String,
        required: true,
        ref: 'Category'
    },
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    }
}, { timestamps: false });

module.exports = mongoose.model('Application', ApplicationSchema)

