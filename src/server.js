const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
require('dotenv').config();

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// auth routes
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);

// users routes
const userRoutes = require('./routes/users');
app.use('/api/v1/users', userRoutes);

// bicycles + tariffs
const bicycleRoutes = require('./routes/bicycles');
app.use('/api/v1/bicycles', bicycleRoutes);

// tariffs nested (bicycle-specific)
const tariffRoutes = require('./routes/tariffs');
app.use('/api/v1/bicycles', tariffRoutes);

// histories
const histories = require('./routes/histories');
app.use('/api/v1/histories', histories);

// external services
const external = require('./routes/external');
app.use('/api/v1/external-services', external);

// works
const works = require('./routes/works');
app.use('/api/v1/works', works);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});