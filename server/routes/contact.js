export default function registerContactRoutes(app, { transporter, SMTP_USER }) {
  app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      console.log(`Sending contact email from ${name} <${email}>`);
      const info = await transporter.sendMail({
        from: SMTP_USER,
        to: '0121718aaa@gmail.com',
        replyTo: email,
        subject: subject || `Contact form submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      });
      if (info.rejected?.length) {
        console.error('Contact email rejected', info.rejected);
        throw new Error('Email was rejected by SMTP server');
      }
      console.log('Contact email sent successfully', {
        messageId: info.messageId,
        response: info.response
      });
      res.sendStatus(204);
    } catch (err) {
      console.error('contact error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
}
