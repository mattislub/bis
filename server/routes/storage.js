import express from 'express';
import { query } from '../db.js';

export default function registerStorageRoutes(app) {
  app.get('/api/storage/:key', async (req, res) => {
    try {
      const userEmail = req.header('x-user-email');
      if (req.params.key.includes('-')) {
        if (!userEmail || !req.params.key.startsWith(`${userEmail}-`)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      const { rows } = await query('SELECT data FROM storage WHERE key = $1', [req.params.key]);
      return res.status(200).json(rows[0]?.data ?? null);
    } catch (err) {
      console.error('storage get error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });

  // MGET – load multiple keys
  app.post('/api/storage/mget', express.json(), async (req, res) => {
    try {
      const { keys } = req.body || {};
      if (!Array.isArray(keys) || !keys.length) {
        return res.status(400).json({ error: 'keys[] is required' });
      }
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const { rows } = await query(
        `SELECT key, data FROM storage WHERE key IN (${placeholders})`,
        keys
      );
      const map = Object.fromEntries(rows.map((r) => [r.key, r.data]));
      return res.status(200).json({ values: map });
    } catch (err) {
      console.error('storage mget error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });

  app.post('/api/storage/:key', express.json(), async (req, res) => {
    try {
      const userEmail = req.header('x-user-email');
      if (req.params.key.includes('-')) {
        if (!userEmail || !req.params.key.startsWith(`${userEmail}-`)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      await query(
        `INSERT INTO storage(key, data)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`,
        [req.params.key, JSON.stringify(req.body ?? {})]
      );
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('storage set error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });
}
