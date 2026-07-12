const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/org');
const assetRoutes = require('./routes/assets');
const allocationRoutes = require('./routes/allocations');
const bookingRoutes = require('./routes/bookings');
const maintenanceRoutes = require('./routes/maintenance');
const auditRoutes = require('./routes/audits');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AssetFlow API Server running.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Sync Database and Start Server
const startServer = async () => {
  try {
    // sequelize.sync() creates tables if they do not exist.
    // alter: true updates schema if columns change slightly.
    await sequelize.sync({ alter: true });
    console.log('✔ SQLite Database synced successfully.');
    
    app.listen(PORT, () => {
      console.log(`✔ Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✘ Failed to sync database or start server:', error);
    process.exit(1);
  }
};

startServer();
