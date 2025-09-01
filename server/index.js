import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { init, query } from './db.js';

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

try {
  await init();
  console.log('DB ready');
} catch (e) {
  console.error('DB init failed:', e);
  process.exit(1);
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/register', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const password = crypto.randomBytes(8).toString('hex'); // שוקל לעבור ל-token reset
  try {
    await query(
      `INSERT INTO users(email, password)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
      [email, password]
    );

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'SeatFlow account details',
      text: `Your password is: ${password}`
    });

    res.sendStatus(204);
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:email', async (req, res) => {
  const { email } = req.params;
  const { gabbaiName, phone, synagogueName, address, city, contactPhone } = req.body || {};
  try {
    await query(
      `UPDATE users
       SET gabbai_name=$1, phone=$2, synagogue_name=$3, address=$4, city=$5, contact_phone=$6
       WHERE email=$7`,
       [gabbaiName, phone, synagogueName, address, city, contactPhone, email]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('update user error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/storage/:key', async (req, res) => {
  try {
    const { rows } = await query('SELECT data FROM storage WHERE key = $1', [req.params.key]);
    res.json(rows[0]?.data ?? null);
  } catch (err) {
    console.error('storage get error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/storage/:key', async (req, res) => {
  try {
    await query(
      `INSERT INTO storage(key, data)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`,
      [req.params.key, req.body ?? {}]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('storage set error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
