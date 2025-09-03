import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

export async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS storage (
      key text PRIMARY KEY,
      data jsonb
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email text PRIMARY KEY,
      password text NOT NULL,
      gabbai_name text,
      phone text,
      synagogue_name text,
      address text,
      city text,
      contact_phone text
    )
  `);
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
      description text,
      details jsonb
    )
  `);
  await pool.query(`ALTER TABLE credit_charges ADD COLUMN IF NOT EXISTS details jsonb`);
}

export function query(text, params) {
  return pool.query(text, params);
}
