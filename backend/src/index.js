require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'Amity Work Graph API' }));

// 404 handler
app.use((_, res) => res.status(404).json({ error: 'Route not found.' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Amity Work Graph API running on http://localhost:${PORT}`);
});
