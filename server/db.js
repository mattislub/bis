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
}

export function query(text, params) {
  return pool.query(text, params);
}
