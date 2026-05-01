const express = require('express');
const router  = express.Router();
const mysql   = require('mysql2/promise');

const pool = mysql.createPool({
  host     : process.env.DB_HOST,
  port     : process.env.DB_PORT,
  user     : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit   : 10,
});

// GET semua transaksi
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transaksi ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST tambah transaksi
router.post('/', async (req, res) => {
  try {
    const { keterangan } = req.body;
    const [result] = await pool.query(
      'INSERT INTO transaksi (keterangan) VALUES (?)', [keterangan]
    );
    res.status(201).json({ id: result.insertId, keterangan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;