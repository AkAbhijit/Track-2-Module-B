const mongoose = require('mongoose');

const UserTokenSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    }
}, { timestamps: false });

module.exports = mongoose.model('UserToken', UserTokenSchema);
