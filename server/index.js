import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { init, query } from './db.js';

const logoPath = new URL('https://seatflow.tech/logo.svg', import.meta.url).pathname;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const {
  ZCREDIT_BASE_URL,
  ZCREDIT_TERMINAL,
  ZCREDIT_PASSWORD,
  ZCREDIT_KEY,
  PUBLIC_BASE_URL
} = process.env;

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

    console.log('Sending registration email to', email);
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
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
    const { amount, description, customerName, customerEmail, orderId } = req.body;
    const endpoint = `${ZCREDIT_BASE_URL}PaymentGateway.asmx/CreateWebCheckoutSession`;

    const successUrl = `${PUBLIC_BASE_URL}/thank-you?orderId=${encodeURIComponent(orderId || '')}`;
    const cancelUrl = `${PUBLIC_BASE_URL}/payment-cancelled?orderId=${encodeURIComponent(orderId || '')}`;
    const callbackUrl = `${PUBLIC_BASE_URL}/api/zcredit/callback`;

    const payload = {
      TerminalNumber: ZCREDIT_TERMINAL,
      TerminalPassword: ZCREDIT_PASSWORD,
      ZCreditKey: ZCREDIT_KEY,
      TransactionSum: Number(amount),
      Payments: 1,
      CurrencyCode: 1,
      TransactionType: 1,
      CustomerName: customerName || '',
      CustomerEmail: customerEmail || '',
      Description: description || `Order ${orderId || ''}`,
      SuccessRedirectUrl: successUrl,
      CancelRedirectUrl: cancelUrl,
      CallbackUrl: callbackUrl,
      ExternalOrderId: orderId || ''
    };

    const response = await axios.post(endpoint, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const checkoutUrl =
      response.data?.WebCheckoutUrl ||
      response.data?.CheckoutPage ||
      response.data?.Url;

    if (!checkoutUrl) {
      return res.status(500).json({
        ok: false,
        message: 'לא התקבל קישור תשלום מה־API',
        raw: response.data
      });
    }

    return res.json({ ok: true, checkoutUrl, raw: response.data });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: 'שגיאה ביצירת קישור תשלום',
      error: err.response?.data || err.message
    });
  }
});

app.post('/api/zcredit/callback', async (req, res) => {
  try {
    console.log('ZCredit Callback body:', req.body);

    const signatureFromZC = req.body.Signature;
    const dataToSign = req.body.DataToSign;

    if (signatureFromZC && dataToSign) {
      const hmac = crypto
        .createHmac('sha256', ZCREDIT_KEY)
        .update(dataToSign, 'utf8')
        .digest('hex');

      const valid = hmac.toLowerCase() === String(signatureFromZC).toLowerCase();
      if (!valid) {
        console.warn('אזהרה: חתימה לא תואמת!');
      }
    } else {
      console.warn('אזהרה: לא נמצאו שדות חתימה – עדכן לפי התיעוד שלך.');
    }

    const status = req.body.Status || req.body.status || '';
    const transactionId = req.body.TransactionId || req.body.transactionId || '';
    const authNumber = req.body.AuthNumber || req.body.authNumber || '';
    const orderId = req.body.ExternalOrderId || req.body.orderId || '';

    console.log('Parsed:', { status, transactionId, authNumber, orderId });

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).send('Server error');
  }
});

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
