import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { init, query } from './db.js';
import cors from 'cors';

const logoPath = new URL('../public/logo.svg', import.meta.url).pathname;

const app = express();

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
const allowedOrigins = ['https://seatflow.tech', 'https://www.seatflow.tech'];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

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

    console.log('Sending registration email to', email);
    const info = await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'SeatFlow - פרטי התחברות',
      text: `סיסמתך היא: ${password}. להתחברות: https://seatflow.tech/login`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;direction:rtl;text-align:right;">
          <img src="cid:logo" alt="SeatFlow logo" style="max-width:150px;margin-bottom:16px;" />
          <h1 style="color:#1e40af;">ברוך הבא ל-SeatFlow</h1>
          <p>היי, תודה שנרשמת למערכת שלנו. להלן סיסמתך:</p>
          <p style="font-size:24px;font-weight:bold;color:#1e3a8a;">${password}</p>
          <p>כדי להתחבר למערכת לחץ על הקישור הבא:</p>
          <a href="https://seatflow.tech/login" style="display:inline-block;padding:10px 20px;background-color:#1e40af;color:#ffffff;text-decoration:none;border-radius:8px;">התחברות למערכת</a>
        </div>
      `,
      attachments: [
        {
          filename: 'logo.svg',
          path: logoPath,
          cid: 'logo'
        }
      ]
    });
    if (info.rejected?.length) {
      console.error('Email rejected by server', info.rejected);
      throw new Error('Email was rejected by SMTP server');
    }
    if (!info.accepted?.length) {
      console.error('No recipients accepted the email');
      throw new Error('Email was not accepted by any recipients');
    }
    console.log('Email sent', info.messageId, 'accepted:', info.accepted);

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

app.post('/api/zcredit/create-checkout', async (req, res) => {
  try {
    const { amount, description, customerName, customerEmail, orderId, coupon, installments } = req.body || {};
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ ok: false, message: 'Amount is required' });
    }

    const coupons = { SEAT10: 0.9, SEAT20: 0.8 };
    const finalAmount = Number(amount) * (coupons[coupon] || 1);

    const endpoint = (process.env.ZCREDIT_CREATE_SESSION_URL || '').replace(/\/+$/, '');
    const key = process.env.ZCREDIT_WEBCHECKOUT_KEY;
    if (!endpoint || !key) {
      return res.status(500).json({ ok:false, message:'Missing ZCredit config (endpoint/key)' });
    }

    const uniqueOrderId = orderId || `ORD-${Date.now()}`;

    // URLs לחזרה
    const successUrl  = `${PUBLIC_BASE_URL}/#/thank-you?orderId=${encodeURIComponent(uniqueOrderId)}`;
    const cancelUrl   = `${PUBLIC_BASE_URL}/#/payment-cancelled?orderId=${encodeURIComponent(uniqueOrderId)}`;
    const callbackUrl = `${PUBLIC_BASE_URL}/api/zcredit/callback`;

    // payload לפי ה־spec של WebCheckout (שמות/רישיות חשובים!)
    const payload = {
      Key: key,
      Local: 'He',
      UniqueId: uniqueOrderId,
      SuccessUrl: successUrl,
      CancelUrl: cancelUrl,
      CallbackUrl: callbackUrl,
      PaymentType: 'regular',
      ShowCart: 'false',
      Installments: { Type: 'regular', MinQuantity: String(installments || 1), MaxQuantity: String(installments || 1) },
      Customer: {
        Email: customerEmail || '',
        Name: customerName || '',
        PhoneNumber: '',
        Attributes: { HolderId: 'optional', Name: 'optional', PhoneNumber: 'optional', Email: 'optional' }
      },
      CartItems: [{
        Amount: Number(finalAmount).toFixed(2),   // מחרוזת "120.00"
        Currency: 'ILS',
        Name: description || `Order ${uniqueOrderId}`,
        Description: description || `Order ${uniqueOrderId}`,
        Quantity: 1,
        IsTaxFree: 'false',
        AdjustAmount: 'false',
        Image: ''
      }]
    };

    console.log('ZC CreateSession URL:', endpoint);

    const r = await axios.post(endpoint, payload, {
      headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
      timeout: 20000,
      validateStatus: () => true
    });

    if (r.status >= 400) {
      const raw = typeof r.data === 'string' ? r.data.slice(0, 1000) : JSON.stringify(r.data).slice(0, 1000);
      return res.status(502).json({ ok:false, message:'ZCredit error', status:r.status, raw });
    }

    const data = r.data || {};
    const sessionUrl = data?.Data?.SessionUrl || data?.SessionUrl;
    if (!sessionUrl) {
      const raw = typeof data === 'string' ? data.slice(0, 1000) : JSON.stringify(data).slice(0, 1000);
      return res.status(502).json({ ok:false, message:'לא התקבל SessionUrl מה-API', raw });
    }

    // שמירת הלקוח והחיוב במסד הנתונים
    let clientId;
    if (customerEmail || customerName) {
      const clientRes = await query(
        `INSERT INTO clients(name, email)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING client_id`,
        [customerName || '', customerEmail || null]
      );
      clientId = clientRes.rows?.[0]?.client_id;
    }

    if (clientId) {
      await query(
        `INSERT INTO credit_charges(client_id, order_id, amount, currency, description, status, is_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (order_id) DO UPDATE SET
           client_id = EXCLUDED.client_id,
           amount = EXCLUDED.amount,
           currency = EXCLUDED.currency,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           is_paid = EXCLUDED.is_paid`,
        [clientId, uniqueOrderId, Number(amount).toFixed(2), 'ILS', description || '', 'pending', false]
      );
    }

    return res.json({ ok:true, checkoutUrl: sessionUrl, orderId: uniqueOrderId });
  } catch (err) {
    const raw = err?.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data.slice(0, 1000) : err.response.data)
      : err.message;
    console.error('create-checkout error:', raw);
    return res.status(500).json({ ok:false, message:'שגיאה ביצירת קישור תשלום', error: raw });
  }
});

app.post('/api/zcredit/callback', async (req, res) => {
  try {
    // body יכול להגיע כ-JSON או כ-form
    const body = req.body || {};
    console.log('ZCredit Callback:', body);

    // save raw callback payload
    try {
      await query(`INSERT INTO zcredit_callbacks(payload) VALUES ($1)`, [body]);
    } catch (e) {
      console.error('Failed to store callback payload', e);
    }

    // אימות חתימה (דוגמה בלבד – עדכן לפי הדוק שלך)
    const signature = body.Signature || body.signature;
    const dataToSign = body.DataToSign || body.dataToSign;
    if (signature && dataToSign) {
      const hmac = crypto.createHmac('sha256', ZCREDIT_KEY)
        .update(String(dataToSign), 'utf8')
        .digest('hex');
      if (hmac.toLowerCase() !== String(signature).toLowerCase()) {
        console.warn('אזהרה: חתימה לא תואמת');
        // יתכן שתרצה להשיב 400 כדי שינסו שוב
        // return res.status(400).send('invalid signature');
      }
    }

    // שלוף נתונים חשובים (שמות שדות עשויים להשתנות בין מסלולים)
    const status = body.Status || body.status;
    const transactionId = body.TransactionId || body.transactionId;
    const authNumber = body.AuthNumber || body.authNumber;
    const orderId = body.ExternalOrderId || body.orderId;
    const isPaid = status && ['success', 'approved', 'paid'].includes(String(status).toLowerCase());

    console.log('Parsed:', { status, transactionId, authNumber, orderId });

    // כאן עדכן DB אצלך לפי הסטטוס שקיבלת
    if (orderId) {
      await query(
        `UPDATE credit_charges
         SET status = $1,
             transaction_id = $2,
             transaction_date = NOW(),
             details = $3,
             is_paid = $4
         WHERE order_id = $5`,
        [status || '', transactionId || authNumber || '', body, isPaid, orderId]
      );

      if (isPaid) {
        try {
          const { rows } = await query(
            `SELECT c.email FROM credit_charges cc JOIN clients c ON cc.client_id = c.client_id WHERE cc.order_id = $1`,
            [orderId]
          );
          const email = rows?.[0]?.email;
          if (email) {
            const password = crypto.randomBytes(8).toString('hex');
            await query(
              `INSERT INTO users(email, password)
               VALUES ($1, $2)
               ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
              [email, password]
            );
            const info = await transporter.sendMail({
              from: SMTP_USER,
              to: email,
              subject: 'SeatFlow - פרטי התחברות',
              text: `סיסמתך היא: ${password}. להתחברות: https://seatflow.tech/login`,
              html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;direction:rtl;text-align:right;">
                  <img src="cid:logo" alt="SeatFlow logo" style="max-width:150px;margin-bottom:16px;" />
                  <h1 style="color:#1e40af;">ברוך הבא ל-SeatFlow</h1>
                  <p>היי, תודה שרכשת את החבילה שלנו. להלן סיסמתך:</p>
                  <p style="font-size:24px;font-weight:bold;color:#1e3a8a;">${password}</p>
                  <p>כדי להתחבר למערכת לחץ על הקישור הבא:</p>
                  <a href="https://seatflow.tech/login" style="display:inline-block;padding:10px 20px;background-color:#1e40af;color:#ffffff;text-decoration:none;border-radius:8px;">התחברות למערכת</a>
                </div>
              `,
              attachments: [
                {
                  filename: 'logo.svg',
                  path: logoPath,
                  cid: 'logo'
                }
              ]
            });
            if (info.rejected?.length || !info.accepted?.length) {
              console.error('Thank you email failed', info);
            }
          }
        } catch (e) {
          console.error('Error sending thank you email', e);
        }
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).send('Server error');
  }
});

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
