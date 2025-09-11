import { query } from '../db.js';

export default function registerUserRoutes(app) {
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

  app.put('/api/users/:email/role', async (req, res) => {
    const { email } = req.params;
    const { role } = req.body || {};
    if (!['demo', 'pro', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    try {
      await query('UPDATE users SET role=$1 WHERE email=$2', [role, email]);
      res.sendStatus(204);
    } catch (err) {
      console.error('update role error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });

  app.get('/api/users/:email', async (req, res) => {
    try {
      const { rows } = await query(
        `SELECT
          email,
          gabbai_name AS "gabbaiName",
          phone,
          synagogue_name AS "synagogueName",
          address,
          city,
          contact_phone AS "contactPhone",
          role
        FROM users
        WHERE email = $1`,
        [req.params.email]
      );
      if (!rows.length) {
        return res.sendStatus(404);
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('get user error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const { rows } = await query(`
        SELECT
          email,
          gabbai_name AS "gabbaiName",
          phone,
          synagogue_name AS "synagogueName",
          address,
          city,
          contact_phone AS "contactPhone",
          role
        FROM users
      `);
      res.json(rows);
    } catch (err) {
      console.error('list users error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
  
  app.delete('/api/users/:email', async (req, res) => {
    try {
      await query('DELETE FROM users WHERE email=$1', [req.params.email]);
      res.sendStatus(204);
    } catch (err) {
      console.error('delete user error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
}
