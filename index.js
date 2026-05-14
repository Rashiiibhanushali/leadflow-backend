require('dotenv').config();
console.log('DB URL:', process.env.DATABASE_URL);


const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'LeadFlow API is running',
    version: '1.0.0'
  });
});

// GET all leads from real database
app.get('/leads', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );
    res.json({
      count: result.rows.length,
      leads: result.rows
    });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST /leads — create a new lead
app.post('/leads', async (req, res) => {
  const { name, email, phone, source, status } = req.body;

  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, source, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone, source || 'Manual', status || 'New']
    );

    res.status(201).json({
      message: 'Lead created successfully',
      lead: result.rows[0]
    });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// ── Start Server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});