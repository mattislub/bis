import { query } from '../db.js';

export default function registerZcreditCallbackRoutes(app) {
  app.get('/api/zcredit-callbacks', async (req, res) => {
    try {
      const { rows } = await query(
        `SELECT id, payload, received_at AS "receivedAt" FROM zcredit_callbacks ORDER BY id DESC`
      );
      res.json(rows);
    } catch (err) {
      console.error('list zcredit callbacks error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
}
