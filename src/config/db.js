const mongoose = require('mongoose');
require('dotenv').config();

exports.connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log('MongoDB connected successfully');
            });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
