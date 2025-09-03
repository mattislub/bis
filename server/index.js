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

  try {
    const existing = await query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (existing.rowCount) {
      try {
        await transporter.sendMail({
          from: SMTP_USER,
          to: email,
          subject: 'SeatFlow - כתובת כבר קיימת',
          text: `התקבלה בקשה לפתיחת חשבון עבור ${email}, אך כבר קיים חשבון במערכת. אם שכחתם את הסיסמה, ניתן לשחזר אותה בקישור: https://seatflow.tech/#/login`,
        });
      } catch (e) {
        console.error('Conflict email failed', e);
      }
      return res.status(409).json({
        error:
          'המייל כבר רשום במערכת. האם תרצו להשתמש בכתובת מייל אחרת או לשחזר את הסיסמה?'
      });
    }

    const password = crypto.randomBytes(8).toString('hex'); // שוקל לעבור ל-token reset
    await query(
      `INSERT INTO users(email, password)
       VALUES ($1, $2)`,
      [email, password]
    );

    console.log('Sending registration email to', email);
    const info = await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'SeatFlow - פרטי התחברות',
      text: `האימייל שלך: ${email}\nסיסמתך היא: ${password}. להתחברות: https://seatflow.tech/#/login`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ברוכים הבאים ל-SeatFlow</title>
        </head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:40px 30px;text-align:center;position:relative;">
              <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"80\" cy=\"40\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"40\" cy=\"80\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></svg>');"></div>
              <div style="position:relative;z-index:1;">
                <img src="cid:logo" alt="SeatFlow logo" style="max-width:80px;height:80px;margin-bottom:20px;filter:brightness(0) invert(1);" />
                <h1 style="color:#ffffff;font-size:32px;font-weight:900;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
                  ברוכים הבאים ל-SeatFlow
                </h1>
                <p style="color:#e0e7ff;font-size:16px;margin:10px 0 0 0;opacity:0.9;">
                  ניהול מושבים חכם, פשוט וזורם
                </p>
              </div>
            </div>
            
            <!-- Content -->
            <div style="padding:40px 30px;">
              <div style="text-align:center;margin-bottom:30px;">
                <h2 style="color:#1f2937;font-size:24px;font-weight:700;margin:0 0 15px 0;">
                  החשבון שלך מוכן!
                </h2>
                <p style="color:#6b7280;font-size:16px;line-height:1.6;margin:0;">
                  תודה שהצטרפת למערכת שלנו. החשבון שלך נוצר בהצלחה ואתה יכול להתחיל להשתמש בכל התכונות.
                </p>
              </div>
              
              <!-- Credentials Box -->
              <div style="background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);border-radius:15px;padding:25px;margin:30px 0;text-align:center;border:2px solid #e5e7eb;">
                <p style="color:#374151;font-size:14px;margin:0 0 10px 0;font-weight:600;">
                  כתובת המייל שלך:
                </p>
                <div style="background:#ffffff;border-radius:10px;padding:15px;border:2px dashed #3b82f6;margin:10px 0;">
                  <span style="font-size:20px;font-weight:700;color:#1e40af;font-family:monospace;direction:ltr;">
                    ${email}
                  </span>
                </div>
                <p style="color:#374151;font-size:14px;margin:20px 0 10px 0;font-weight:600;">
                  הסיסמה שלך:
                </p>
                <div style="background:#ffffff;border-radius:10px;padding:15px;border:2px dashed #3b82f6;margin:10px 0;">
                  <span style="font-size:28px;font-weight:900;color:#1e40af;font-family:monospace;letter-spacing:2px;">
                    ${password}
                  </span>
                </div>
                <p style="color:#6b7280;font-size:12px;margin:10px 0 0 0;">
                  💡 שמור את הסיסמה במקום בטוח
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:30px 0;">
                <a href="https://seatflow.tech/#/login" style="display:inline-block;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:700;font-size:16px;box-shadow:0 10px 20px rgba(59,130,246,0.3);transition:all 0.3s ease;">
                  🚀 התחבר למערכת עכשיו
                </a>
              </div>
              
              <!-- Features -->
              <div style="margin:40px 0;">
                <h3 style="color:#1f2937;font-size:18px;font-weight:700;margin:0 0 20px 0;text-align:center;">
                  מה אתה יכול לעשות עכשיו:
                </h3>
                <div style="display:grid;gap:15px;">
                  <div style="display:flex;align-items:center;padding:15px;background:#f8fafc;border-radius:10px;border-right:4px solid #10b981;">
                    <span style="font-size:20px;margin-left:15px;">🏛️</span>
                    <span style="color:#374151;font-weight:600;">עיצוב מפת בית הכנסת שלך</span>
                  </div>
                  <div style="display:flex;align-items:center;padding:15px;background:#f8fafc;border-radius:10px;border-right:4px solid #3b82f6;">
                    <span style="font-size:20px;margin-left:15px;">👥</span>
                    <span style="color:#374151;font-weight:600;">ניהול רשימת המתפללים</span>
                  </div>
                  <div style="display:flex;align-items:center;padding:15px;background:#f8fafc;border-radius:10px;border-right:4px solid #f59e0b;">
                    <span style="font-size:20px;margin-left:15px;">📄</span>
                    <span style="color:#374151;font-weight:600;">ייצוא מפות לקבצי PDF</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;">
                צריך עזרה? אנחנו כאן בשבילך!
              </p>
              <div style="margin:15px 0;">
                <a href="mailto:info@seatflow.online" style="color:#3b82f6;text-decoration:none;font-weight:600;margin:0 15px;">
                  📧 info@seatflow.online
                </a>
                <span style="color:#d1d5db;">|</span>
                <a href="tel:052-718-6026" style="color:#3b82f6;text-decoration:none;font-weight:600;margin:0 15px;">
                  📞 052-718-6026
                </a>
              </div>
              <div style="margin:20px 0;padding:20px 0;border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">
                  © 2025 SeatFlow.tech - כל הזכויות שמורות<br>
                  ניהול מושבים חכם, פשוט וזורם
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
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

app.post('/api/reset', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const existing = await query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (!existing.rowCount) {
      return res.sendStatus(204);
    }

    const password = crypto.randomBytes(8).toString('hex');
    await query('UPDATE users SET password=$1 WHERE email=$2', [password, email]);

    console.log('Sending password reset email to', email);
    const info = await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'SeatFlow - סיסמה חדשה',
      text: `סיסמתך החדשה: ${password}. להתחברות: https://seatflow.tech/#/login`,
    });
    if (info.rejected?.length) {
      console.error('Email rejected by server', info.rejected);
      throw new Error('Email was rejected by SMTP server');
    }
    if (!info.accepted?.length) {
      console.error('No recipients accepted the email');
      throw new Error('Email was not accepted by any recipients');
    }
    console.log('Reset email sent', info.messageId, 'accepted:', info.accepted);

    res.sendStatus(204);
  } catch (err) {
    console.error('reset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { rows } = await query(
      `SELECT email, password, gabbai_name AS "gabbaiName", phone, synagogue_name AS "synagogueName", address, city, contact_phone AS "contactPhone" FROM users WHERE email=$1`,
      [email]
    );
    const user = rows[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }
    delete user.password;
    res.json({ user });
  } catch (err) {
    console.error('login error:', err);
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
              text: `סיסמתך היא: ${password}. להתחברות: https://seatflow.tech/#/login`,
              html: `
                <!DOCTYPE html>
                <html dir="rtl" lang="he">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>תודה על הרכישה - SeatFlow</title>
                </head>
                <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#10b981 0%,#059669 100%);min-height:100vh;">
                  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:40px 30px;text-align:center;position:relative;">
                      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"80\" cy=\"40\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"40\" cy=\"80\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></svg>');"></div>
                      <div style="position:relative;z-index:1;">
                        <div style="background:#ffffff;border-radius:50%;width:100px;height:100px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 20px rgba(0,0,0,0.1);">
                          <span style="font-size:40px;">🎉</span>
                        </div>
                        <h1 style="color:#ffffff;font-size:32px;font-weight:900;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
                          תודה על הרכישה!
                        </h1>
                        <p style="color:#d1fae5;font-size:16px;margin:10px 0 0 0;opacity:0.9;">
                          החבילה הפרו שלך מופעלת ומוכנה לשימוש
                        </p>
                      </div>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding:40px 30px;">
                      <div style="text-align:center;margin-bottom:30px;">
                        <h2 style="color:#1f2937;font-size:24px;font-weight:700;margin:0 0 15px 0;">
                          החשבון הפרו שלך מוכן!
                        </h2>
                        <p style="color:#6b7280;font-size:16px;line-height:1.6;margin:0;">
                          תודה שרכשת את החבילה הפרו שלנו. עכשיו יש לך גישה לכל התכונות המתקדמות של המערכת.
                        </p>
                      </div>
                      
                      <!-- Password Box -->
                      <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border-radius:15px;padding:25px;margin:30px 0;text-align:center;border:2px solid #10b981;">
                        <p style="color:#065f46;font-size:14px;margin:0 0 10px 0;font-weight:600;">
                          הסיסמה שלך:
                        </p>
                        <div style="background:#ffffff;border-radius:10px;padding:15px;border:2px dashed #10b981;margin:10px 0;">
                          <span style="font-size:28px;font-weight:900;color:#059669;font-family:monospace;letter-spacing:2px;">
                            ${password}
                          </span>
                        </div>
                        <p style="color:#047857;font-size:12px;margin:10px 0 0 0;">
                          🔐 שמור את הסיסמה במקום בטוח
                        </p>
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align:center;margin:30px 0;">
                        <a href="https://seatflow.tech/#/login" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:700;font-size:16px;box-shadow:0 10px 20px rgba(16,185,129,0.3);transition:all 0.3s ease;">
                          ✨ התחבר לחשבון הפרו שלך
                        </a>
                      </div>
                      
                      <!-- Pro Features -->
                      <div style="margin:40px 0;">
                        <h3 style="color:#1f2937;font-size:18px;font-weight:700;margin:0 0 20px 0;text-align:center;">
                          התכונות הפרו שלך:
                        </h3>
                        <div style="display:grid;gap:15px;">
                          <div style="display:flex;align-items:center;padding:15px;background:#f0fdf4;border-radius:10px;border-right:4px solid #10b981;">
                            <span style="font-size:20px;margin-left:15px;">🏛️</span>
                            <span style="color:#374151;font-weight:600;">עיצוב מפות ללא הגבלה</span>
                          </div>
                          <div style="display:flex;align-items:center;padding:15px;background:#f0fdf4;border-radius:10px;border-right:4px solid #10b981;">
                            <span style="font-size:20px;margin-left:15px;">📄</span>
                            <span style="color:#374151;font-weight:600;">ייצוא PDF באיכות הדפסה</span>
                          </div>
                          <div style="display:flex;align-items:center;padding:15px;background:#f0fdf4;border-radius:10px;border-right:4px solid #10b981;">
                            <span style="font-size:20px;margin-left:15px;">🏷️</span>
                            <span style="color:#374151;font-weight:600;">מדבקות למקומות ישיבה</span>
                          </div>
                          <div style="display:flex;align-items:center;padding:15px;background:#f0fdf4;border-radius:10px;border-right:4px solid #10b981;">
                            <span style="font-size:20px;margin-left:15px;">📺</span>
                            <span style="color:#374151;font-weight:600;">קישור למסך תצוגה</span>
                          </div>
                          <div style="display:flex;align-items:center;padding:15px;background:#f0fdf4;border-radius:10px;border-right:4px solid #10b981;">
                            <span style="font-size:20px;margin-left:15px;">👥</span>
                            <span style="color:#374151;font-weight:600;">ניהול מתפללים מתקדם</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Support -->
                      <div style="background:#f8fafc;border-radius:15px;padding:25px;margin:30px 0;text-align:center;">
                        <h4 style="color:#1f2937;font-size:16px;font-weight:700;margin:0 0 10px 0;">
                          🎯 תמיכה פרמיום
                        </h4>
                        <p style="color:#6b7280;font-size:14px;margin:0;">
                          כלקוח פרו, אתה זכאי לתמיכה מהירה ומקצועית. אנחנו כאן לעזור לך להפיק את המקסימום מהמערכת.
                        </p>
                      </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;">
                        צריך עזרה? התמיכה הפרו שלנו זמינה עבורך!
                      </p>
                      <div style="margin:15px 0;">
                        <a href="mailto:info@seatflow.online" style="color:#10b981;text-decoration:none;font-weight:600;margin:0 15px;">
                          📧 info@seatflow.online
                        </a>
                        <span style="color:#d1d5db;">|</span>
                        <a href="tel:052-718-6026" style="color:#10b981;text-decoration:none;font-weight:600;margin:0 15px;">
                          📞 052-718-6026
                        </a>
                      </div>
                      <div style="margin:20px 0;padding:20px 0;border-top:1px solid #e5e7eb;">
                        <p style="color:#9ca3af;font-size:12px;margin:0;">
                          © 2025 SeatFlow.tech - כל הזכויות שמורות<br>
                          ניהול מושבים חכם, פשוט וזורם
                        </p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
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
