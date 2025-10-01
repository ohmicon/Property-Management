import sql from "mssql";

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,       // เช่น "localhost"
  database: process.env.DB_NAME,
  options: {
    encrypt: true,                  // ถ้า Azure SQL ให้เป็น true
    trustServerCertificate: true,   // ถ้า local dev ให้เป็น true
  },
} as sql.config;

let pool: sql.ConnectionPool;

export async function getConnection() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
    } catch (err) {
      console.error("Database connection failed", err);
      throw err;
    }
  }
  return pool;
}