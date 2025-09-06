import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS storage (
      key text PRIMARY KEY,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `ALTER TABLE storage ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW()`
  );
  await pool.query(
    `ALTER TABLE storage ALTER COLUMN data SET DEFAULT '{}'::jsonb`
  );
  await pool.query(
    `ALTER TABLE storage ALTER COLUMN data SET NOT NULL`
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email text PRIMARY KEY,
      password text NOT NULL,
      gabbai_name text,
      phone text,
      synagogue_name text,
      address text,
      city text,
      contact_phone text,
      role text NOT NULL DEFAULT 'demo'
    )
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'demo'`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      name text,
      email text UNIQUE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS credit_charges (
      charge_id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(client_id),
      order_id text UNIQUE,
      amount NUMERIC(10,2),
      currency text,
      transaction_date TIMESTAMP,
      transaction_id text,
      status text,
      is_paid BOOLEAN DEFAULT FALSE,
      description text,
      details jsonb
    )
  `);
  await pool.query(`ALTER TABLE credit_charges ADD COLUMN IF NOT EXISTS details jsonb`);
  await pool.query(`ALTER TABLE credit_charges ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS zcredit_callbacks (
      id SERIAL PRIMARY KEY,
      payload jsonb,
      received_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const ms = Date.now() - start;
    console.log(`[DB] ${text.split('\n')[0].slice(0,120)} (${ms}ms) rows=${res.rowCount}`);
    return res;
  } catch (err) {
    console.error('[DB] ERROR:', err.message);
    console.error('[DB] SQL:', text);
    console.error('[DB] PARAMS:', params);
    throw err;
  }
}
