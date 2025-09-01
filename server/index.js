import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { init, query } from './db.js';

const app = express();
app.use(express.json());

await init();

app.post('/api/register', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  const password = crypto.randomBytes(8).toString('hex');
  try {
    await query(
      'INSERT INTO users(email, password) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password = $2',
      [email, password]
    );
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'SeatFlow account details',
      text: `Your password is: ${password}`
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/storage/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await query('SELECT data FROM storage WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/storage/:key', async (req, res) => {
  const { key } = req.params;
  const data = req.body;
  try {
    await query(
      'INSERT INTO storage(key, data) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET data = $2',
      [key, data]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
