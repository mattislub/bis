import { query } from '../db.js';

export default function registerCreditChargeRoutes(app) {
  app.get('/api/credit-charges', async (req, res) => {
    try {
      const { rows } = await query(`
        SELECT
          cc.charge_id AS "chargeId",
          c.email,
          cc.order_id AS "orderId",
          cc.amount,
          cc.currency,
          cc.transaction_date AS "transactionDate",
          cc.transaction_id AS "transactionId",
          cc.status,
          cc.is_paid AS "isPaid",
          cc.description
        FROM credit_charges cc
        LEFT JOIN clients c ON cc.client_id = c.client_id
        ORDER BY cc.charge_id DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error('list credit charges error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
}
