require('dotenv').config();
console.log('DB URL:', process.env.DATABASE_URL);


const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://leadflow-frontend-five.vercel.app"
  ]
}));
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
// GET /leads — fetch all leads, optional filter by status
app.get('/leads', async (req, res) => {
  const { status } = req.query;

  try {
    let query = 'SELECT * FROM leads ORDER BY created_at DESC';
    let params = [];

    if (status) {
      query = 'SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC';
      params = [status];
    }

    const result = await pool.query(query, params);
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

// PATCH /leads/:id — update lead status
app.patch('/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['New', 'Contacted', 'Qualified', 'Closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Must be one of: New, Contacted, Qualified, Closed'
    });
  }

  try {
    const result = await pool.query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      message: 'Lead updated successfully',
      lead: result.rows[0]
    });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// POST /webhook/lead — accept lead from external source
app.post('/webhook/lead', async (req, res) => {
  // Security — validate secret token from header
  const token = req.headers['x-webhook-secret'];
  if (token !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorised — invalid webhook secret' });
  }

  const { name, email, phone, source, status } = req.body;

  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, source, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        email,
        phone  || null,
        source || 'Webhook',
        status || 'New'
      ]
    );

    res.status(201).json({
      message: 'Lead received via webhook',
      lead: result.rows[0]
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// ── Start Server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});