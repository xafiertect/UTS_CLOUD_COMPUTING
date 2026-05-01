const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app    = express();
const logDir = '/app/logs';

app.use(express.json());

// Middleware: tulis setiap request ke audit.log
app.use((req, res, next) => {
  const line = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  fs.appendFileSync(path.join(logDir, 'audit.log'), line);
  next();
});

// Routes
const transaksiRoutes = require('./routes/transaksi');
app.use('/api/transaksi', transaksiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('API Engine berjalan di port 3000');
});