import express from 'express';
import { init, query } from './db.js';

const app = express();
app.use(express.json());

await init();

app.get('/api/storage/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await query('SELECT data FROM storage WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/storage/:key', async (req, res) => {
  const { key } = req.params;
  const data = req.body;
  try {
    await query(
      'INSERT INTO storage(key, data) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET data = $2',
      [key, data]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
