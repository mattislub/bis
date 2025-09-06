import express from 'express';
import { query } from '../db.js';

export default function registerStorageRoutes(app) {
  // GET single key
  app.get('/api/storage/:key', async (req, res) => {
    const key = req.params.key;
    const email = req.header('x-user-email');
    console.log(`[STORAGE/GET] key=${key} email=${email || '-'} ip=${req.ip}`);
    try {
      if (key.includes('-')) {
        if (!email || !key.startsWith(`${email}-`)) {
          console.warn(`[STORAGE/GET] 403 key/email mismatch`);
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      const { rows } = await query('SELECT data FROM storage WHERE key = $1', [key]);
      const found = !!rows[0];
      console.log(`[STORAGE/GET] found=${found}`);
      return res.status(200).json(rows[0]?.data ?? null);
    } catch (err) {
      console.error('[STORAGE/GET] error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });

  // MGET – load multiple keys
  app.post('/api/storage/mget', express.json(), async (req, res) => {
    const keys = req.body?.keys;
    console.log(`[STORAGE/MGET] keys=${Array.isArray(keys) ? keys.length : 0}`);
    try {
      if (!Array.isArray(keys) || !keys.length) {
        return res.status(400).json({ error: 'keys[] is required' });
      }
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const { rows } = await query(
        `SELECT key, data FROM storage WHERE key IN (${placeholders})`,
        keys
      );
      const map = Object.fromEntries(rows.map((r) => [r.key, r.data]));
      console.log(`[STORAGE/MGET] hit=${rows.length}/${keys.length}`);
      return res.status(200).json({ values: map });
    } catch (err) {
      console.error('[STORAGE/MGET] error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });

  // SET single key
  app.post('/api/storage/:key', express.json(), async (req, res) => {
    const key = req.params.key;
    const email = req.header('x-user-email');
    const bodyPreview = JSON.stringify(req.body)?.slice(0, 200);
    console.log(`[STORAGE/SET] key=${key} email=${email || '-'} body=${bodyPreview}`);
    try {
      if (key.includes('-')) {
        if (!email || !key.startsWith(`${email}-`)) {
          console.warn(`[STORAGE/SET] 403 key/email mismatch`);
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      await query(
        `INSERT INTO storage(key, data)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [key, JSON.stringify(req.body ?? {})]
      );
      console.log(`[STORAGE/SET] saved`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[STORAGE/SET] error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });

  // Generic API: /api/storage/set { key, value }
  app.post('/api/storage/set', express.json(), async (req, res) => {
    const { key, value } = req.body || {};
    console.log(`[STORAGE/SET2] key=${key} body=${JSON.stringify(value)?.slice(0, 200)}`);
    try {
      if (!key) return res.status(400).json({ error: 'key is required' });
      await query(
        `INSERT INTO storage(key, data)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [key, JSON.stringify(value ?? {})]
      );
      console.log(`[STORAGE/SET2] saved`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[STORAGE/SET2] error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  });
}
