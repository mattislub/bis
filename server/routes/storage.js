import { query } from '../db.js';

export default function registerStorageRoutes(app) {
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
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`,
        [req.params.key, JSON.stringify(req.body ?? {})]
      );
      res.sendStatus(204);
    } catch (err) {
      console.error('storage set error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
}
