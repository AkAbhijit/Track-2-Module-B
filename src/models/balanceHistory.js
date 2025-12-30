const mongoose = require('mongoose');

const BalanceHistorySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    type:
    {
        type: String,
        enum: ['REPLENISHMENT', 'WITHDRAWAL', 'RENTAL', 'MODERATION_REWARD'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false });

module.exports = mongoose.model('BalanceHistory', BalanceHistorySchema);
