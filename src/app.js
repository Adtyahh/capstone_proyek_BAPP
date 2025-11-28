const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const bapbRoutes = require('./routes/bapbRoutes');
const bappRoutes = require('./routes/bappRoutes'); 
const signatureRoutes = require('./routes/signatureRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files untuk serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'BAPB & BAPP System API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bapb', bapbRoutes);
app.use('/api/bapp', bappRoutes); 
app.use('/api/signatures', signatureRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Sync database and start server
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to database:', err);
});