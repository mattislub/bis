import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { init } from './db.js';
import cors from 'cors';

import registerAuthRoutes from './routes/auth.js';
import registerUserRoutes from './routes/users.js';
import registerStorageRoutes from './routes/storage.js';
import registerZCreditRoutes from './routes/zcredit.js';

const app = express();

const generatePassword = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

// --- ENV guardrails ---
const must = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
};

const ZCREDIT_KEY = must('ZCREDIT_KEY');
const PUBLIC_BASE_URL = must('PUBLIC_BASE_URL');
const SMTP_HOST = must('SMTP_HOST');
const SMTP_PORT = must('SMTP_PORT');
const SMTP_USER = must('SMTP_USER');
const SMTP_PASS = must('SMTP_PASS');
const SMTP_SECURE = must('SMTP_SECURE') === 'true';

// --- CORS ---
const allowedOrigins = [
  'https://seatflow.tech',
  'https://www.seatflow.tech',
  'https://seatflow.online',
  'https://www.seatflow.online',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const corsConfig = {
  origin(origin, cb) {
    // קריאות פנימיות/בריאות/סרברים בלי Origin
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // לא לזרוק Error — רק לא להוסיף כותרות CORS
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};


app.options('*', cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// --- Body parsers ---
// Z-Credit עלול לשלוח callback כ-JSON או כ-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

try {
  await init();
  console.log('DB ready');
} catch (e) {
  console.error('DB init failed:', e);
  process.exit(1);
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

registerAuthRoutes(app, { transporter, generatePassword, SMTP_USER });
registerUserRoutes(app);
registerStorageRoutes(app);
registerZCreditRoutes(app, { transporter, generatePassword, PUBLIC_BASE_URL, ZCREDIT_KEY, SMTP_USER });

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
