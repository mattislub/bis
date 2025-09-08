import axios from 'axios';
import crypto from 'crypto';
import { query } from '../db.js';

export default function registerZCreditRoutes(
  app,
  { PUBLIC_BASE_URL, PUBLIC_BASE_URL_API, ZCREDIT_KEY, transporter, generatePassword, SMTP_USER }
) {
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

      // בסיסי כתובות ללא לוכסן סופי
      const publicBase = (PUBLIC_BASE_URL || '').replace(/\/+$/, '');
      const apiBase = (PUBLIC_BASE_URL_API || publicBase).replace(/\/+$/, '');

      // URLs לחזרה
      const successUrl  = `${publicBase}/#/thank-you?orderId=${encodeURIComponent(uniqueOrderId)}`;
      const cancelUrl   = `${publicBase}/#/payment-cancelled?orderId=${encodeURIComponent(uniqueOrderId)}`;
      const callbackUrl = `${apiBase}/api/zcredit/callback`;
  
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
          [clientId, uniqueOrderId, Number(finalAmount), 'ILS', description || '', 'pending', false]
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
        await query(`INSERT INTO zcredit_callbacks(payload) VALUES ($1::jsonb)`, [JSON.stringify(body)]);
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
               details = $3::jsonb,
               is_paid = $4
           WHERE order_id = $5`,
          [status || '', transactionId || authNumber || '', JSON.stringify(body), isPaid, orderId]
        );

        if (isPaid) {
          try {
            const { rows } = await query(
              `SELECT c.email FROM credit_charges cc JOIN clients c ON cc.client_id = c.client_id WHERE cc.order_id = $1`,
              [orderId]
            );
            const email = rows?.[0]?.email;
            if (email) {
              try {
                const userRes = await query('SELECT password FROM users WHERE email=$1', [email]);
                let password;
                if (userRes.rowCount) {
                  password = userRes.rows[0].password;
                  await query(`UPDATE users SET role = 'pro' WHERE email = $1`, [email]);
                } else {
                  password = generatePassword();
                  await query(
                    `INSERT INTO users(email, password, role) VALUES ($1, $2, 'pro')`,
                    [email, password]
                  );
                }

                const info = await transporter.sendMail({
                  from: SMTP_USER,
                  to: email,
                  subject: 'SeatFlow - תודה על התשלום',
                  text: `תודה על התשלום!\nהאימייל שלך: ${email}\nסיסמתך: ${password}. להתחברות: https://seatflow.tech/#/login`,
                  html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SeatFlow - תודה על התשלום</title>
          </head>
          <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;direction:rtl;text-align:right;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
              <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:40px 30px;text-align:center;color:#ffffff;">
                <img src="https://seatflow.tech/logo.svg" alt="SeatFlow logo" style="max-width:80px;height:80px;margin-bottom:20px;filter:brightness(0) invert(1);" />
                <h1 style="margin:0;font-size:32px;font-weight:900;">תודה על התשלום!</h1>
                <p style="margin:10px 0 0 0;font-size:16px;opacity:0.9;">החשבון שלך מוכן. הנה הפרטים שלך:</p>
              </div>
              <div style="padding:40px 30px;">
                <div style="background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);border-radius:15px;padding:25px;margin:30px 0;text-align:center;border:2px solid #e5e7eb;">
                  <p style="color:#374151;font-size:14px;margin:0 0 10px 0;font-weight:600;">כתובת המייל שלך:</p>
                  <div style="background:#ffffff;border-radius:10px;padding:15px;border:2px dashed #3b82f6;margin:10px 0;">
                    <span style="font-size:20px;font-weight:700;color:#1e40af;font-family:monospace;direction:ltr;">${email}</span>
                  </div>
                  <p style="color:#374151;font-size:14px;margin:20px 0 10px 0;font-weight:600;">הסיסמה שלך:</p>
                  <div style="background:#ffffff;border-radius:10px;padding:15px;border:2px dashed #3b82f6;margin:10px 0;">
                    <span style="font-size:28px;font-weight:900;color:#1e40af;font-family:monospace;letter-spacing:2px;">${password}</span>
                  </div>
                  <p style="color:#6b7280;font-size:12px;margin:10px 0 0 0;">💡 שמור את הסיסמה במקום בטוח</p>
                </div>
                <div style="text-align:center;margin:30px 0;">
                  <a href="https://seatflow.tech/#/login" style="display:inline-block;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:700;font-size:16px;box-shadow:0 10px 20px rgba(59,130,246,0.3);transition:all 0.3s ease;">🚀 התחבר למערכת עכשיו</a>
                </div>
              </div>
              <div style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;">צריך עזרה? אנחנו כאן בשבילך!</p>
                <div style="margin:15px 0;">
                  <a href="mailto:info@seatflow.online" style="color:#3b82f6;text-decoration:none;font-weight:600;margin:0 15px;">📧 info@seatflow.online</a>
                  <span style="color:#d1d5db;">|</span>
                  <a href="tel:052-718-6026" style="color:#3b82f6;text-decoration:none;font-weight:600;margin:0 15px;">📞 052-718-6026</a>
                </div>
                <p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 SeatFlow.tech - כל הזכויות שמורות<br>ניהול מושבים חכם, פשוט וזורם</p>
              </div>
            </div>
          </body>
          </html>
                  `,
                });
                if (info.rejected?.length) {
                  console.error('Email rejected by server', info.rejected);
                }
                if (!info.accepted?.length) {
                  console.error('No recipients accepted the email');
                }
              } catch (e) {
                console.error('Error sending thank-you email', e);
              }
            }
          } catch (e) {
            console.error('Error updating user', e);
          }
        }
      }
  
      return res.status(200).send('OK');
    } catch (err) {
      console.error('Callback error:', err);
      return res.status(500).send('Server error');
    }
  });
  
}
