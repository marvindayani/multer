require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const assetRoutes = require('./routes/assetRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware parsing json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/api/assets', assetRoutes);

const PORT = 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
