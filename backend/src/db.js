const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const connectionString = String(process.env.DATABASE_URL || '').trim() || null; // ej: mysql://user:pass@127.0.0.1:3306/jj-indum

let pool = null;
if (connectionString) {
  const sslFlag = String(process.env.MYSQL_SSL || process.env.DATABASE_SSL || process.env.DB_SSL || '').trim().toLowerCase();
  const sslEnabled = ['1', 'true', 'yes', 'on'].includes(sslFlag);
  const rejectFlag = String(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase();
  const rejectUnauthorized = !['0', 'false', 'no', 'off'].includes(rejectFlag);
  try {
    const u = new URL(connectionString);
    if (String(u.protocol || '').toLowerCase() !== 'mysql:') {
      pool = null;
    } else {
    const port = u.port ? Number(u.port) : 3306;
    const database = (u.pathname || '').replace(/^\//, '') || undefined;
    pool = mysql.createPool({
      host: u.hostname,
      port,
      user: decodeURIComponent(u.username || ''),
      password: decodeURIComponent(u.password || ''),
      database,
      ssl: sslEnabled ? { rejectUnauthorized } : undefined,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    }
  } catch (err) {
    // mysql2 soporta URI directamente
    pool = mysql.createPool(connectionString);
  }
} else {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : undefined;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (host && user && database) {
    pool = mysql.createPool({
      host,
      port: port || 3306,
      user,
      password,
      database,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
}

async function query(text, params) {
  if (!pool) {
    return { rows: [] };
  }
  const [rowsOrOk] = await pool.execute(text, params || []);
  if (Array.isArray(rowsOrOk)) {
    return { rows: rowsOrOk };
  }
  // OkPacket para INSERT/UPDATE/DELETE
  return { rows: [], insertId: rowsOrOk.insertId, affectedRows: rowsOrOk.affectedRows };
}

async function applySqlStatementsFromFile(relativeFilePath) {
  if (!pool) return false;
  const filePath = path.join(__dirname, '..', relativeFilePath);
  if (!fs.existsSync(filePath)) return false;
  const contents = fs.readFileSync(filePath, 'utf8');
  // Quitar líneas de comentario y normalizar separadores
  const noComments = contents
    .split(/\r?\n/)
    .filter(line => !/^\s*--/.test(line))
    .join('\n');
  const statements = noComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const conn = await pool.getConnection();
  try {
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        void 0;
      }
    }
  } finally {
    conn.release();
  }
  return true;
}

async function ensureSchema() {
  try {
    // Ejecutar schema.sql (idempotente por IF NOT EXISTS)
    await applySqlStatementsFromFile('schema.sql');

    // Asegurar columnas faltantes en tablas existentes (migraciones manuales rápidas)
    if (pool) {
      try { await pool.query('ALTER TABLE products ADD COLUMN sold_count INT NOT NULL DEFAULT 0 AFTER quantity'); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE products ADD COLUMN colors VARCHAR(255) NOT NULL DEFAULT ''"); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE products ADD COLUMN sizes VARCHAR(255) NOT NULL DEFAULT ''"); } catch (_) { void 0; }

      try { await pool.query("ALTER TABLE contact_messages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pendiente'"); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE contact_messages ADD COLUMN reply TEXT NULL"); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE contact_messages ADD COLUMN replied_by_email VARCHAR(255) NULL"); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE contact_messages ADD COLUMN replied_by_name VARCHAR(255) NULL"); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE contact_messages ADD COLUMN replied_at TIMESTAMP NULL DEFAULT NULL"); } catch (_) { void 0; }

      try { await pool.query('ALTER TABLE promotions ADD COLUMN product_id INT UNSIGNED NULL AFTER id'); } catch (_) { void 0; }
      try { await pool.query('ALTER TABLE promotions ADD CONSTRAINT fk_promotions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL'); } catch (_) { void 0; }
      try { await pool.query('ALTER TABLE promotions ADD COLUMN promo_price INT NULL'); } catch (_) { void 0; }
      try { await pool.query('ALTER TABLE promotions ADD COLUMN promo_stock INT NOT NULL DEFAULT 0'); } catch (_) { void 0; }
      try { await pool.query('ALTER TABLE promotions ADD COLUMN promo_stock_remaining INT NOT NULL DEFAULT 0'); } catch (_) { void 0; }
      try { await pool.query('ALTER TABLE promotions ADD COLUMN start_at DATETIME NULL'); } catch (_) { void 0; }
      try { await pool.query('ALTER TABLE promotions ADD COLUMN end_at DATETIME NULL'); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE promotions ADD COLUMN state VARCHAR(32) NULL"); } catch (_) { void 0; }

      try { await pool.query('ALTER TABLE sales ADD COLUMN promotion_id INT UNSIGNED NULL'); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE sales ADD COLUMN price_type VARCHAR(20) NOT NULL DEFAULT 'normal'"); } catch (_) { void 0; }

      try { await pool.query('UPDATE promotions SET promo_price = COALESCE(promo_price, price) WHERE promo_price IS NULL'); } catch (_) { void 0; }
      try { await pool.query('UPDATE promotions SET promo_stock_remaining = COALESCE(promo_stock_remaining, promo_stock, 0)'); } catch (_) { void 0; }
      try { await pool.query("UPDATE promotions SET state = COALESCE(state, 'activa')"); } catch (_) { void 0; }

      try { await pool.query("ALTER TABLE order_items ADD COLUMN color VARCHAR(50) NOT NULL DEFAULT ''"); } catch (_) { void 0; }
      try { await pool.query("ALTER TABLE order_items ADD COLUMN talle VARCHAR(20) NOT NULL DEFAULT ''"); } catch (_) { void 0; }
    }

    // Ejecutar seed.sql (si existe)
    await applySqlStatementsFromFile('seed.sql');
  } catch (err) {
    // No bloquear inicio si falla
  }
}

module.exports = { query, ensureSchema };
