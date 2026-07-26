import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false }
});

const [rows] = await conn.query("SHOW TABLES LIKE 'rooms'");
console.log(rows.length ? 'ROOMS_TABLE_PRESENT' : 'ROOMS_TABLE_MISSING');
await conn.end();
