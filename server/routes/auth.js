import { query } from '../db.js';

export default function registerAuthRoutes(app, { transporter, generatePassword, SMTP_USER }) {
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
  
      const password = generatePassword();
      await query(
        `INSERT INTO users(email, password, role)
         VALUES ($1, $2, 'demo')`,
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
          <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;direction:rtl;text-align:right;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:40px 30px;text-align:center;position:relative;">
                <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"80\" cy=\"40\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"40\" cy=\"80\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></svg>');"></div>
                <div style="position:relative;z-index:1;">
                  <img src="https://seatflow.tech/logo.svg" alt="SeatFlow logo" style="max-width:80px;height:80px;margin-bottom:20px;filter:brightness(0) invert(1);" />
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
        `
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
  
      const password = generatePassword();
      await query('UPDATE users SET password=$1 WHERE email=$2', [password, email]);
  
      console.log('Sending password reset email to', email);
      const info = await transporter.sendMail({
        from: SMTP_USER,
        to: email,
        subject: 'SeatFlow - סיסמה חדשה',
        text: `סיסמתך החדשה: ${password}. להתחברות: https://seatflow.tech/#/login`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>איפוס סיסמה ל-SeatFlow</title>
          </head>
          <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;direction:rtl;text-align:right;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
              <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:40px 30px;text-align:center;position:relative;">
                <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"80\" cy=\"40\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"40\" cy=\"80\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></svg>');"></div>
                <div style="position:relative;z-index:1;">
                  <img src="https://seatflow.tech/logo.svg" alt="SeatFlow logo" style="max-width:80px;height:80px;margin-bottom:20px;filter:brightness(0) invert(1);" />
                  <h1 style="color:#ffffff;font-size:32px;font-weight:900;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    איפוס סיסמה ב-SeatFlow
                  </h1>
                  <p style="color:#e0e7ff;font-size:16px;margin:10px 0 0 0;opacity:0.9;">
                    ניהול מושבים חכם, פשוט וזורם
                  </p>
                </div>
              </div>
  
              <div style="padding:40px 30px;">
                <div style="text-align:center;margin-bottom:30px;">
                  <h2 style="color:#1f2937;font-size:24px;font-weight:700;margin:0 0 15px 0;">
                    הסיסמה שלך אופסה!
                  </h2>
                  <p style="color:#6b7280;font-size:16px;line-height:1.6;margin:0;">
                    בקשתך לאיפוס הסיסמה בוצעה בהצלחה. להלן הסיסמה החדשה שלך.
                  </p>
                </div>
  
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
                    הסיסמה החדשה שלך:
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
  
                <div style="text-align:center;margin:30px 0;">
                  <a href="https://seatflow.tech/#/login" style="display:inline-block;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:700;font-size:16px;box-shadow:0 10px 20px rgba(59,130,246,0.3);transition:all 0.3s ease;">
                    🚀 התחבר למערכת עכשיו
                  </a>
                </div>
  
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
                  </div>
                </div>
              </div>
  
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
        `
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
        `SELECT email, password, gabbai_name AS "gabbaiName", phone, synagogue_name AS "synagogueName", address, city, contact_phone AS "contactPhone", role FROM users WHERE email=$1`,
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
  
}
