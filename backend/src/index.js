const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

dotenv.config();

function resolveEnvRef(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const m1 = v.match(/^\$(\w+)$/);
  if (m1) return String(process.env[m1[1]] || '').trim();
  const m2 = v.match(/^\$\{(\w+)\}$/);
  if (m2) return String(process.env[m2[1]] || '').trim();
  const m3 = v.match(/^\$\{\{\s*(\w+)\s*\}\}$/);
  if (m3) return String(process.env[m3[1]] || '').trim();
  return v;
}

function pickDbUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.MYSQL_URL,
    process.env.MYSQL_PUBLIC_URL,
    process.env.MYSQL_URI,
    process.env.MYSQL_PUBLIC_URI,
  ]
    .map(resolveEnvRef)
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .filter(v => /^mysql:\/\//i.test(v));

  const withHost = candidates.map((value) => {
    try { return { value, host: new URL(value).hostname || null }; } catch (_) { return { value, host: null }; }
  });
  const preferred = withHost.find(x => x.host !== '127.0.0.1' && x.host !== 'localhost') || withHost[0] || null;
  return preferred ? preferred.value : '';
}

const DB_URL = pickDbUrl();
const DB_ENABLED = Boolean(
  (DB_URL && /^mysql:\/\//i.test(DB_URL)) ||
  (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE)
);

const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim();
const SMTP_HOST = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const SMTP_PORT = parseInt(String(process.env.SMTP_PORT || '587').trim(), 10);
const SMTP_SECURE = String(process.env.SMTP_PORT || '').trim() === '465';
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER).trim();
const SMTP_PLACEHOLDER = (SMTP_USER === 'your-email@gmail.com' || !SMTP_USER || !SMTP_PASS);
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const RESEND_FROM = String(process.env.RESEND_FROM || '').trim();

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  connectionTimeout: parseInt(String(process.env.SMTP_CONNECTION_TIMEOUT || '5000'), 10),
  greetingTimeout: parseInt(String(process.env.SMTP_GREETING_TIMEOUT || '5000'), 10),
  socketTimeout: parseInt(String(process.env.SMTP_SOCKET_TIMEOUT || '7000'), 10),
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function withTimeout(promise, ms) {
  const t = Number(ms) || 0;
  if (!t) return promise;
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), t)),
  ]);
}

async function sendEmailViaResend({ to, subject, html }) {
  try {
    if (!RESEND_API_KEY || !RESEND_FROM) return false;
    memory.smtp = memory.smtp || {};
    memory.smtp.lastAttemptAt = new Date().toISOString();
    memory.smtp.lastProvider = 'resend';
    const r = await withTimeout(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      }),
      parseInt(String(process.env.RESEND_SEND_TIMEOUT || '4000'), 10)
    );
    if (r && r.__timeout) {
      memory.smtp.lastError = 'Resend: timeout';
      memory.smtp.lastErrorAt = new Date().toISOString();
      return false;
    }
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      memory.smtp.lastError = `Resend: ${r.status} ${txt}`.slice(0, 500);
      memory.smtp.lastErrorAt = new Date().toISOString();
      return false;
    }
    memory.smtp.lastOkAt = new Date().toISOString();
    memory.smtp.lastError = null;
    return true;
  } catch (err) {
    memory.smtp = memory.smtp || {};
    memory.smtp.lastProvider = 'resend';
    memory.smtp.lastError = `Resend: ${String(err?.message || err)}`.slice(0, 500);
    memory.smtp.lastErrorAt = new Date().toISOString();
    return false;
  }
}

async function sendEmail({ to, subject, html }) {
  try {
    const resendOk = await sendEmailViaResend({ to, subject, html });
    if (resendOk) return true;
    if (SMTP_PLACEHOLDER) {
      console.warn('⚠️ SMTP no configurado: faltan SMTP_USER/SMTP_PASS (o SMTP_PASSWORD).');
      console.log(`SIMULACIÓN DE ENVÍO A ${to}: [${subject}]`);
      return false;
    }
    memory.smtp = memory.smtp || {};
    memory.smtp.lastAttemptAt = new Date().toISOString();
    memory.smtp.lastProvider = 'smtp';
    const info = await transporter.sendMail({
      from: `"${process.env.ADMIN_NAME || 'JJ Indumentaria'}" <${SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    memory.smtp.lastOkAt = new Date().toISOString();
    memory.smtp.lastError = null;
    return true;
  } catch (err) {
    console.error('❌ Error enviando email:', err.message);
    memory.smtp = memory.smtp || {};
    memory.smtp.lastError = String(err?.message || err);
    memory.smtp.lastErrorAt = new Date().toISOString();
    return false;
  }
}

async function sendEmailFast(payload) {
  const r = await withTimeout(sendEmail(payload), parseInt(String(process.env.SMTP_SEND_TIMEOUT || '2500'), 10));
  if (r && r.__timeout) return false;
  return Boolean(r);
}

function getOrderStatusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pendiente') return 'Pendiente';
  if (s === 'preparando') return 'Preparando';
  if (s === 'listo') return 'Listo para envío';
  if (s === 'enviado') return 'Enviado';
  if (s === 'entregado') return 'Entregado';
  if (s === 'cancelado') return 'Cancelado';
  return s || 'Actualizado';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function splitName(fullName) {
  const t = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!t) return { name: '', lastName: '' };
  const parts = t.split(' ').filter(Boolean);
  if (parts.length === 1) return { name: parts[0], lastName: '' };
  return { name: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

function generateOrderStatusEmailHtml({ orderId, newStatus, oldStatus, frontendUrl }) {
  const labelNew = getOrderStatusLabel(newStatus);
  const labelOld = oldStatus ? getOrderStatusLabel(oldStatus) : null;
  const statusLine = labelOld ? `${labelOld} → ${labelNew}` : labelNew;
  const link = `${String(frontendUrl || '').replace(/\/$/, '')}/user-panel?tab=pedidos`;
  return `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #1E3A8A; text-align: center;">Actualización de tu pedido</h2>
      <p>Tu pedido <strong>#${orderId}</strong> cambió de estado:</p>
      <div style="background: #f8f9fa; padding: 14px; border-radius: 8px; border: 1px solid #eee;">
        <p style="margin: 0; font-weight: bold;">${statusLine}</p>
      </div>
      <div style="text-align: center; margin: 26px 0;">
        <a href="${link}" style="background: #1E3A8A; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Ver estado del pedido
        </a>
      </div>
      <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
        Si no realizaste este pedido, podés ignorar este mensaje.
      </p>
    </div>
  `;
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function generateVerificationCode() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

function generateOrderEmailHtml(order, frontendUrl) {
  const itemsHtml = (order.items || []).map(it => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${it.name} x ${it.qty || it.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(it.price * (it.qty || it.quantity)).toFixed(2)}</td>
    </tr>
  `).join('');

  const shippingHtml = order.shipping?.cost > 0 ? `
    <tr>
      <td style="padding: 10px; font-weight: bold;">Costo de envío</td>
      <td style="padding: 10px; text-align: right; font-weight: bold;">$${order.shipping.cost.toFixed(2)}</td>
    </tr>
  ` : '';

  return `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #1E3A8A; text-align: center;">¡Gracias por tu compra!</h2>
      <p>Hola, hemos recibido tu pedido <strong>#${order.id}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Producto</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${shippingHtml}
        </tbody>
        <tfoot>
          <tr style="font-size: 18px; font-weight: bold;">
            <td style="padding: 10px; text-align: right;">Total:</td>
            <td style="padding: 10px; text-align: right; color: #1E3A8A;">$${(order.total || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">Datos de entrega:</p>
        <p style="margin: 5px 0 0;">${order.shipping?.address || 'Retiro en local'}</p>
        ${order.shipping?.province ? `<p style="margin: 0;">${order.shipping.province}${order.shipping.postalCode ? ` (${order.shipping.postalCode})` : ''}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${frontendUrl}/user-panel?tab=pedidos" style="background: #1E3A8A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Ver mi pedido
        </a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        Podrás ver el estado de tu pedido y el recorrido desde tu panel de usuario.
      </p>
    </div>
  `;
}

// Mercado Pago SDK v2
let mpClient = null;
let mpModules = null;
try {
  mpModules = require('mercadopago');
  const { MercadoPagoConfig } = mpModules;
  dotenv.config();
  if (process.env.MP_ACCESS_TOKEN) {
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  }
} catch (err) {
  // SDK no instalado aún
}

dotenv.config();

const app = express();
app.use(cors());
// Aceptar payloads grandes (imágenes en base64) desde el panel admin
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', async (req, res) => {
  const commit =
    process.env.RENDER_GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    null;
  let dbOk = false;
  let dbError = null;
  if (DB_ENABLED) {
    try {
      await db.query('SELECT 1 AS ok');
      dbOk = true;
    } catch (err) {
      dbOk = false;
      dbError = err?.message || String(err);
    }
  }
  res.json({
    status: 'ok',
    commit,
    dbEnabled: DB_ENABLED,
    dbOk,
    dbError,
    dbTarget: db?.dbMeta ? { mode: db.dbMeta.mode, source: db.dbMeta.source || null, host: db.dbMeta.host, port: db.dbMeta.port, database: db.dbMeta.database } : null,
    smtpConfigured: !SMTP_PLACEHOLDER,
    resendConfigured: Boolean(RESEND_API_KEY && RESEND_FROM),
    smtpHost: SMTP_HOST,
    smtpPort: SMTP_PORT,
    smtpUser: SMTP_USER ? `${SMTP_USER.slice(0, 3)}***${SMTP_USER.includes('@') ? '@' + SMTP_USER.split('@')[1] : ''}` : null,
    smtpFrom: SMTP_FROM || null,
    mailProviderLast: memory.smtp?.lastProvider || null,
    smtpLastAttemptAt: memory.smtp?.lastAttemptAt || null,
    smtpLastOkAt: memory.smtp?.lastOkAt || null,
    smtpLastErrorAt: memory.smtp?.lastErrorAt || null,
    smtpLastError: memory.smtp?.lastError || null,
    persistPath: PERSIST_PATH,
  });
});

// Inicialización automática de DB (schema + seed, idempotente)
(async () => {
  try {
    if (typeof db.ensureSchema === 'function') {
      await db.ensureSchema();
      console.log('DB schema ensured (schema.sql/seed.sql applied if available)');
    }
  } catch (err) {
    console.warn('DB schema ensure failed:', err?.message || String(err));
  }
})();

// DB: listar tablas disponibles en el esquema actual
app.get('/api/db/tables', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY TABLE_NAME'
    );
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const tables = rows.map(r => r.name || r.TABLE_NAME).filter(Boolean);
    res.json({ ok: true, tables });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'No se pudo listar tablas', detail: err?.message || String(err) });
  }
});

// Productos
app.get('/api/products', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, price, image FROM products ORDER BY id LIMIT 50');
    // Fallback si no hay DB
    const rows = result.rows && result.rows.length ? result.rows : [
      { id: 1, name: 'Chomba', price: 19999, image: '/img/chomba.webp' },
      { id: 2, name: 'Bermuda', price: 24999, image: '/img/bermuda.webp' },
      { id: 3, name: 'Pantalón', price: 29999, image: '/img/pantalon.webp' },
    ];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Productos (todos: DB + memoria + fallback)
app.get('/api/products/all', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, price, image, category, quantity FROM products ORDER BY id LIMIT 100');
    const rows = result.rows && result.rows.length ? result.rows : [];
    const extra = mergeProductsById([Array.isArray(memory.products) ? memory.products : []]);
    const defaults = (rows.length || extra.length) ? [] : [
      { id: 1, name: 'Chomba', price: 19999, image: '/img/chomba.webp', quantity: 20 },
      { id: 2, name: 'Bermuda', price: 24999, image: '/img/bermuda.webp', quantity: 20 },
      { id: 3, name: 'Pantalón', price: 29999, image: '/img/pantalon.webp', quantity: 20 },
    ];
    const combined = mergeProductsById([defaults, extra, rows]);
    res.json(combined);
  } catch (err) {
    const extra = mergeProductsById([Array.isArray(memory.products) ? memory.products : []]);
    const defaults = extra.length ? [] : [
      { id: 1, name: 'Chomba', price: 19999, image: '/img/chomba.webp', quantity: 20 },
      { id: 2, name: 'Bermuda', price: 24999, image: '/img/bermuda.webp', quantity: 20 },
      { id: 3, name: 'Pantalón', price: 29999, image: '/img/pantalon.webp', quantity: 20 },
    ];
    res.json(mergeProductsById([defaults, extra]));
  }
});

// Promociones
app.get('/api/promotions', async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, description, image, price, discount, sizes FROM promotions ORDER BY id LIMIT 50');
    const rows = result.rows && result.rows.length ? result.rows : [
      { id: 1, title: 'Promo 10%', description: '10% de descuento', image: '/img/promo1.webp', price: 19999, discount: 10, sizes: 'S,M,L,XL' },
      { id: 2, title: '2x1 Remeras', description: 'Llevate 2 y pagás 1', image: '/img/promo2.webp', price: 17999, discount: 0, sizes: 'S,M,L' },
    ];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
});

// Promociones (todas: estado, precio visible y stock promocional real)
app.get('/api/promotions/all', async (req, res) => {
  try {
    const promos = await listAdminPromotions();
    const legacyOverrides = listLegacyPromotionOverrides();
    const publicPromos = []
      .concat(Array.isArray(promos) ? promos : [])
      .concat(legacyOverrides);
    if (publicPromos.length > 0) {
      return res.json(publicPromos.map(mapPromotionForPublic));
    }
  } catch (err) {
    void 0;
  }

  const defaults = [
    { id: 1, title: 'Promo 10%', description: '10% de descuento', image: '/img/promo1.webp', price: 19999, discount: 10, sizes: 'S,M,L,XL' },
    { id: 2, title: '2x1 Remeras', description: 'Llevate 2 y pagás 1', image: '/img/promo2.webp', price: 17999, discount: 0, sizes: 'S,M,L' },
  ];
  res.json(defaults);
});

// Contacto
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await db.query('INSERT INTO contact_messages(name, email, message) VALUES(?, ?, ?)', [name, email, message]);
    res.json({ ok: true });
  } catch (err) {
    // Fallback sin DB
    res.json({ ok: true, stored: 'memory' });
  }
});

// --- Auth, Productos y Carrito (fallback en memoria) ---
const memory = {
  users: {},
  admin: { tokens: new Set(), sessions: new Map() },
  products: [
    { id: 101, name: 'Remera JJ', price: 35990, image: '/img/stamford.webp' },
    { id: 102, name: 'Chomba JJ', price: 25000, image: '/img/chomba.webp' },
    { id: 103, name: 'Pantalón Sport JJ', price: 31700, image: '/img/pantalon.webp' },
    { id: 104, name: 'pantalon JJ', price: 25000, image: '/img/bermuda.webp' },
    { id: 105, name: 'Remera Negra JJ', price: 25000, image: '/img/javascript.jpg' },
    { id: 106, name: 'Remera Negra JJ', price: 25000, image: '/img/python.jpg' },
    { id: 107, name: 'Remera Azul C++ JJ', price: 25000, image: '/img/c++.webp' },
    { id: 108, name: 'Remera Negro JJ', price: 25000, image: '/img/gptr,1265x,front,black-c,330,402,600,600-bg,f8f8f8.u3.jpg' },
    { id: 109, name: 'Remera Blanca JJ', price: 25000, image: '/img/1.webp' },
    { id: 110, name: 'Remera Blanca JJ', price: 25000, image: '/img/kotlin.jpg' },
    { id: 111, name: 'Remera Negra JJ', price: 25000, image: '/img/javascript.jpg' },
    { id: 112, name: 'Remera celeste JJ', price: 25000, image: '/img/r.jpg' },
    { id: 113, name: 'buzo negro JJ', price: 25000, image: '/img/rrr.webp' },
    { id: 114, name: 'Remera Negro JJ', price: 25000, image: '/img/ssrco,classic_tee,mens,101010 01c5ca27c6,front_alt,square_product,600x600.jpg' },
    { id: 115, name: 'Chomba Azul JJ', price: 25000, image: '/img/ima3.webp' },
    { id: 116, name: 'Chomba Negra JJ', price: 25000, image: '/img/ima2.webp' },
    { id: 117, name: 'Buzo Negro JJ', price: 25000, image: '/img/todos.jpg' },
    { id: 118, name: 'Chomba JJ', price: 25000, image: '/img/ima1.webp' },
    { id: 1, title: 'Promo 10%', name: 'Promo 10%', description: '10% de descuento', image: '/img/promo1.webp', price: 19999, discount: 10, sizes: 'S,M,L,XL' },
    { id: 2, title: '2x1 Remeras', name: '2x1 Remeras', description: 'Llevate 2 y pagás 1', image: '/img/promo2.webp', price: 17999, discount: 0, sizes: 'S,M,L' },
    { id: 3, title: 'Promo 29% OFF', name: 'Promo 29% OFF', description: 'Descuento especial', image: '/img/promo3.webp', price: 50000, discount: 29, sizes: 'S,M,L,XL' },
    { id: 4, title: 'Promo 20% OFF', name: 'Promo 20% OFF', description: 'Oferta de temporada', image: '/img/promo4.webp', price: 50000, discount: 20, sizes: 'S,M,L,XL' },
    { id: 5, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Descuento exclusivo', image: '/img/promo5.webp', price: 56500, discount: 13, sizes: 'S,M,L,XL' },
    { id: 6, title: 'Promo 29% OFF', name: 'Promo 29% OFF', description: 'Especial camperas', image: '/img/promo6.webp', price: 50000, discount: 29, sizes: 'S,M,L,XL' },
    { id: 7, title: 'Promo 29% OFF', name: 'Promo 29% OFF', description: 'Especial pantalones', image: '/img/promo7.webp', price: 32000, discount: 29, sizes: 'S,M,L,XL' },
    { id: 8, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo8.webp', price: 24300, discount: 13, sizes: 'S,M,L,XL' },
    { id: 9, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo9.webp', price: 24300, discount: 13, sizes: 'S,M,L,XL' },
    { id: 10, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo10.webp', price: 24300, discount: 13, sizes: 'S,M,L,XL' },
    { id: 11, title: 'Promo 20% OFF', name: 'Promo 20% OFF', description: 'Buzos de temporada', image: '/img/promo11.webp', price: 50000, discount: 20, sizes: 'S,M,L,XL' },
    { id: 12, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras clásicas', image: '/img/promo12.webp', price: 24000, discount: 13, sizes: 'S,M,L,XL' },
    { id: 13, title: 'Promo 20% OFF', name: 'Promo 20% OFF', description: 'Buzos de temporada', image: '/img/promo13.webp', price: 50000, discount: 20, sizes: 'S,M,L,XL' },
    { id: 14, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo14.webp', price: 24300, discount: 13, sizes: 'S,M,L,XL' },
    { id: 15, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo15.webp', price: 24300, discount: 13, sizes: 'S,M,L,XL' },
    { id: 16, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Buzos de temporada', image: '/img/promo16.webp', price: 39000, discount: 13, sizes: 'S,M,L,XL' },
    { id: 17, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo17.webp', price: 33000, discount: 13, sizes: 'S,M,L,XL' },
    { id: 18, title: 'Promo 13% OFF', name: 'Promo 13% OFF', description: 'Remeras destacadas', image: '/img/promo18.webp', price: 24300, discount: 13, sizes: 'S,M,L,XL' },
  ],
  sales: [],
  returns: [],
  orderReturns: [],
  carts: {}, // carts[userId] = [{ id, name, price, image, quantity, color?, talle?, description? }]
  orders: [], // { id, customer, items:[{id,name,qty,price}], status:'pendiente'|'preparando'|'enviado'|'entregado', ts }
  suppliers: [], // { id, name, contact, email, phone, notes }
  promotions: [], // { id, title, description, image, price?, discount?, sizes? }
  legacyPromotionOverrides: [], // { id, estado, deleted, title, description, image, price, sizes, updated_at }
  settings: {
    minStock: 2,
    adminEmail: null,
    adminPassword: null,
    adminName: process.env.ADMIN_NAME || 'Sandra',
    companyName: process.env.COMPANY_NAME || 'JJ Indumentaria',
    companyAddress: process.env.COMPANY_ADDRESS || '',
    companyCity: process.env.COMPANY_CITY || '',
    companyPhone: process.env.COMPANY_PHONE || '',
    companyEmail: process.env.COMPANY_EMAIL || '',
    companyCuit: process.env.COMPANY_CUIT || '',
    companyLogo: process.env.COMPANY_LOGO || '/img/JJ-logo.png',
  },
  // Configuración del sitio (Inicio)
  site: {
    home: {
      images: ['/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg', '/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg', '/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg'],
      captions: ['Nueva Temporada 2024', 'Esencia Masculina', 'Estilo sin Límites'],
      intervalMs: 3000,
      pauseOnHover: true,
    },
  },
  favorites: {}, // favorites[userId] = [productId]
  notifications: {}, // notifications[userId] = [{ id, message, ts, read }]
  loyalty: {}, // loyalty[userId] = { points, tier }
  loyaltyFlags: {}, // loyaltyFlags[userId] = { profileCompleted: boolean, lastSpinDate: 'YYYY-MM-DD' }
  payments: { mpPrefs: {} }, // payments.mpPrefs[preferenceId] = orderId
};

const PERSIST_DIR = process.env.PERSIST_DIR
  ? path.resolve(String(process.env.PERSIST_DIR))
  : path.join(__dirname, '..', 'data');
const PERSIST_PATH = process.env.PERSIST_PATH
  ? path.resolve(String(process.env.PERSIST_PATH))
  : path.join(PERSIST_DIR, 'persist.json');

function safePersistState() {
  try {
    if (!fs.existsSync(PERSIST_DIR)) fs.mkdirSync(PERSIST_DIR, { recursive: true });
    const users = memory.users || {};
    const safeUsers = {};
    for (const [k, v] of Object.entries(users)) {
      if (!k) continue;
      safeUsers[String(k).toLowerCase()] = {
        name: v?.name || '',
        email: (v?.email || k || '').toLowerCase(),
        password: v?.password || null,
        is_verified: !!v?.is_verified,
        role: v?.role || 'client',
        created_at: v?.created_at || null,
      };
    }
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      users: safeUsers,
      sales: Array.isArray(memory.sales) ? memory.sales.slice(-5000) : [],
      returns: Array.isArray(memory.returns) ? memory.returns.slice(0, 2000) : [],
      orderReturns: Array.isArray(memory.orderReturns) ? memory.orderReturns.slice(0, 2000) : [],
      adminTokens: Array.from(memory.admin.tokens || []),
      adminSessions: Object.fromEntries(memory.admin.sessions || new Map()),
      products: Array.isArray(memory.products) ? memory.products : [],
      suppliers: Array.isArray(memory.suppliers) ? memory.suppliers : [],
      promotions: Array.isArray(memory.promotions) ? memory.promotions : [],
      legacyPromotionOverrides: Array.isArray(memory.legacyPromotionOverrides) ? memory.legacyPromotionOverrides : [],
      orders: Array.isArray(memory.orders) ? memory.orders : [],
    };
    fs.writeFileSync(PERSIST_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    void 0;
  }
}

function loadPersistState() {
  try {
    if (!fs.existsSync(PERSIST_PATH)) return;
    const raw = fs.readFileSync(PERSIST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.users && typeof parsed.users === 'object') memory.users = parsed.users;
      if (Array.isArray(parsed.sales)) memory.sales = parsed.sales;
      if (Array.isArray(parsed.returns)) memory.returns = parsed.returns;
      if (Array.isArray(parsed.orderReturns)) memory.orderReturns = parsed.orderReturns;
      if (Array.isArray(parsed.adminTokens)) memory.admin.tokens = new Set(parsed.adminTokens);
      if (parsed.adminSessions && typeof parsed.adminSessions === 'object') {
        memory.admin.sessions = new Map(Object.entries(parsed.adminSessions));
      }
      if (Array.isArray(parsed.products)) memory.products = parsed.products;
      if (Array.isArray(parsed.suppliers)) memory.suppliers = parsed.suppliers;
      if (Array.isArray(parsed.promotions)) memory.promotions = parsed.promotions;
      if (Array.isArray(parsed.legacyPromotionOverrides)) memory.legacyPromotionOverrides = parsed.legacyPromotionOverrides;
      if (Array.isArray(parsed.orders)) memory.orders = parsed.orders;
    }
  } catch (err) {
    void 0;
  }
}

loadPersistState();

const PANEL_ROLES = new Set(['admin', 'vendedor', 'stock']);

function normalizePanelRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'administrator') return 'admin';
  if (value === 'seller') return 'vendedor';
  if (value === 'vendedora') return 'vendedor';
  if (value === 'inventory' || value === 'control_stock' || value === 'control de stock') return 'stock';
  return value;
}

function createPanelSession(sessionData) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const role = normalizePanelRole(sessionData?.role);
  const session = {
    email: String(sessionData?.email || '').trim().toLowerCase(),
    name: sessionData?.name || memory.settings.adminName,
    role: PANEL_ROLES.has(role) ? role : 'admin',
  };
  memory.admin.tokens.add(token);
  memory.admin.sessions.set(token, session);
  safePersistState();
  return { token, session };
}

function getPanelSessionFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !memory.admin.tokens.has(token)) return null;
  const session = memory.admin.sessions.get(token);
  if (!session) return null;
  req.panelToken = token;
  req.panelSession = session;
  return session;
}

function requireRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles.map(normalizePanelRole));
  return (req, res, next) => {
    const session = getPanelSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'No autorizado' });
    }
    const role = normalizePanelRole(session.role);
    if (allowed.size > 0 && !allowed.has(role)) {
      return res.status(403).json({ ok: false, error: 'No tenés permisos para realizar esta acción' });
    }
    req.panelSession = { ...session, role };
    next();
  };
}

const requireAdmin = requireRoles('admin');
const requireSalesAccess = requireRoles('admin', 'vendedor');
const requireOrdersAccess = requireRoles('admin', 'vendedor', 'stock');
const requireProductsView = requireRoles('admin', 'vendedor', 'stock');
const requireProductManagement = requireRoles('admin', 'vendedor', 'stock');
const requireInventoryAccess = requireRoles('admin', 'stock');
const requirePromotionsAccess = requireRoles('admin', 'vendedor');
const requireSuppliersAccess = requireRoles('admin', 'stock');

app.put('/api/admin/promotions/legacy/:id/sold-out', requirePromotionsAccess, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Promocion invalida' });
  const current = Array.isArray(memory.legacyPromotionOverrides) ? memory.legacyPromotionOverrides : [];
  const idx = current.findIndex(item => Number(item.id) === id);
  const nextItem = {
    ...(idx >= 0 ? current[idx] : {}),
    id,
    estado: 'agotada',
    deleted: false,
    updated_at: new Date().toISOString(),
  };
  if (idx >= 0) current[idx] = nextItem;
  else current.push(nextItem);
  memory.legacyPromotionOverrides = current;
  safePersistState();
  res.json({ ok: true, item: nextItem });
});

app.delete('/api/admin/promotions/legacy/:id', requirePromotionsAccess, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'Promocion invalida' });
  const current = Array.isArray(memory.legacyPromotionOverrides) ? memory.legacyPromotionOverrides : [];
  const idx = current.findIndex(item => Number(item.id) === id);
  const nextItem = {
    ...(idx >= 0 ? current[idx] : {}),
    id,
    estado: 'eliminada',
    deleted: true,
    updated_at: new Date().toISOString(),
  };
  if (idx >= 0) current[idx] = nextItem;
  else current.push(nextItem);
  memory.legacyPromotionOverrides = current;
  safePersistState();
  res.json({ ok: true });
});

function isPasswordMatch(storedPassword, providedPassword) {
  if (storedPassword == null || providedPassword == null) return false;
  const stored = String(storedPassword).trim();
  const provided = String(providedPassword).trim();
  if (!stored || !provided) return false;
  return stored === provided || stored === sha256Hex(provided);
}

async function findPanelUserByEmail(email) {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (!emailNorm) return null;
  const memoryUser = memory.users[emailNorm];

  try {
    const result = await db.query(
      'SELECT id, name, email, password, is_verified, role FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [emailNorm]
    );
    const row = Array.isArray(result.rows) ? result.rows[0] : null;
    if (row) {
      const dbRole = normalizePanelRole(row.role);
      const dbIsPanelRole = PANEL_ROLES.has(dbRole);
      // Si DB tiene una cuenta no-panel para el mismo email pero en memoria sí hay rol de panel,
      // preferimos memoria para no bloquear accesos válidos de admin/vendedor/stock.
      if (!dbIsPanelRole && memoryUser && PANEL_ROLES.has(normalizePanelRole(memoryUser.role))) {
        throw new Error('fallback-memory-panel-role');
      }
      return {
        id: row.id,
        name: row.name || emailNorm,
        email: (row.email || emailNorm).toLowerCase(),
        password: row.password || null,
        is_verified: row.is_verified == null ? true : !!row.is_verified,
        role: dbRole,
        source: 'db',
      };
    }
  } catch (err) {
    void 0;
  }

  if (!memoryUser) return null;
  return {
    id: memoryUser.id || emailNorm,
    name: memoryUser.name || emailNorm,
    email: (memoryUser.email || emailNorm).toLowerCase(),
    password: memoryUser.password || null,
    is_verified: memoryUser.is_verified == null ? true : !!memoryUser.is_verified,
    role: normalizePanelRole(memoryUser.role),
    source: 'memory',
  };
}

function normalizePromotionState(promo) {
  const now = Date.now();
  const start = promo?.fecha_inicio ? new Date(promo.fecha_inicio).getTime() : null;
  const end = promo?.fecha_fin ? new Date(promo.fecha_fin).getTime() : null;
  const remaining = Number(promo?.stock_promocion_restante) || 0;
  if (promo?.estado === 'agotada' || remaining <= 0) return 'agotada';
  if (promo?.estado === 'finalizada') return 'finalizada';
  if (end && end < now) return 'finalizada';
  if (start && start > now) return 'activa';
  return 'activa';
}

function formatArs(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `ARS ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDiscountLabel(basePrice, promoPrice) {
  const normal = Number(basePrice);
  const promo = Number(promoPrice);
  if (!Number.isFinite(normal) || !Number.isFinite(promo) || normal <= 0 || promo >= normal) {
    return 'OFERTA';
  }
  const pct = Math.round(((normal - promo) / normal) * 100);
  return `${pct}% OFF`;
}

function mapPromotionForPublic(promo) {
  if (promo?.legacy_override) {
    const state = promo.deleted ? 'eliminada' : (promo.estado || 'potencial');
    return {
      id: promo.id,
      productId: null,
      title: promo.title || `Promocion ${promo.id}`,
      description: promo.description || '',
      image: promo.image || '/img/promo1.webp',
      price: formatArs(promo.price ?? 0),
      normalPrice: '',
      discount: state === 'agotada' ? 'AGOTADO' : (state === 'eliminada' ? 'ELIMINADA' : (promo.discount || 'OFERTA')),
      sizes: promo.sizes || '',
      estado: state,
      precioPromocion: Number(promo.price) || 0,
      precioNormal: 0,
      stockPromocion: 0,
      stockPromocionRestante: state === 'agotada' ? 0 : null,
      fechaInicio: null,
      fechaFin: null,
      isLegacy: true,
      deleted: !!promo.deleted,
    };
  }
  const state = normalizePromotionState(promo);
  const displayState = state === 'agotada' ? 'AGOTADO' : (state === 'finalizada' ? 'FIN DE PROMOCION' : 'OFERTA');
  const title = promo.product_name || promo.title || `Producto ${promo.product_id || promo.id}`;
  const promoPrice = promo.precio_promocion ?? promo.price ?? 0;
  const normalPrice = promo.precio_normal ?? null;
  const activePrice = state === 'activa'
    ? promoPrice
    : (normalPrice != null ? normalPrice : promoPrice);
  return {
    id: promo.id,
    productId: promo.product_id || null,
    title,
    description: promo.description || `Promocion para ${title}`,
    image: promo.image || '/img/promo1.webp',
    price: formatArs(activePrice),
    normalPrice: formatArs(normalPrice),
    discount: displayState === 'OFERTA' ? formatDiscountLabel(normalPrice, promoPrice) : displayState,
    sizes: promo.sizes || '',
    estado: state,
    precioPromocion: Number(promoPrice) || 0,
    precioNormal: Number(normalPrice) || 0,
    stockPromocion: Number(promo.stock_promocion) || 0,
    stockPromocionRestante: Number(promo.stock_promocion_restante) || 0,
    fechaInicio: promo.fecha_inicio || null,
    fechaFin: promo.fecha_fin || null,
  };
}

function listLegacyPromotionOverrides() {
  return (Array.isArray(memory.legacyPromotionOverrides) ? memory.legacyPromotionOverrides : [])
    .filter(item => item && item.id != null)
    .map((item) => ({
      ...item,
      id: Number(item.id) || item.id,
      legacy_override: true,
      deleted: !!item.deleted,
    }));
}

function getMemoryProduct(selector) {
  const { id, productName } = selector || {};
  if (Number.isInteger(id)) {
    return memory.products.find(p => Number(p.id) === id) || null;
  }
  const byName = String(productName || '').trim().toLowerCase();
  if (!byName) return null;
  const exact = memory.products.find(p => String(p.name || '').trim().toLowerCase() === byName) || null;
  if (exact) return exact;
  if (byName.length < 3) return null;
  const candidates = memory.products.filter(p => String(p.name || '').trim().toLowerCase().includes(byName));
  if (candidates.length === 1) return candidates[0];
  return null;
}

function normalizeMemoryOrdersItems() {
  const orders = Array.isArray(memory.orders) ? memory.orders : [];
  const products = Array.isArray(memory.products) ? memory.products : [];
  const productIdSet = new Set(products.map(p => Number(p?.id)).filter(Number.isFinite));
  let maxItemId = 0;
  for (const o of orders) {
    const items = Array.isArray(o?.items) ? o.items : [];
    for (const it of items) {
      maxItemId = Math.max(maxItemId, Number(it?.id) || 0);
    }
  }
  maxItemId = Math.max(1000000, maxItemId);
  for (const o of orders) {
    const items = Array.isArray(o?.items) ? o.items : [];
    const used = new Set();
    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};
      const currentId = Number(it.id);
      const existingProductId = Number(it.product_id ?? it.productId);
      const hasExistingProductId = Number.isFinite(existingProductId);
      let inferredProductId = hasExistingProductId ? existingProductId : null;
      if (!hasExistingProductId && Number.isFinite(currentId) && productIdSet.has(currentId)) {
        inferredProductId = currentId;
      }
      const needsNewId = !Number.isFinite(currentId) || used.has(currentId) || (inferredProductId != null && currentId === inferredProductId);
      const nextId = needsNewId ? (++maxItemId) : currentId;
      used.add(nextId);
      items[i] = {
        ...it,
        id: nextId,
        ...(inferredProductId != null ? { product_id: inferredProductId } : {}),
        name: it.name || '',
        qty: Number(it.qty ?? it.quantity ?? 0) || 0,
        price: Number(it.price ?? 0) || 0,
        color: it.color || '',
        talle: it.talle || '',
      };
    }
    o.items = items;
  }
}

function isProductLikeRecord(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.product_id != null || item.productId != null) return false;
  if (item.discount != null) return false;
  return Boolean(item.name || item.title);
}

function normalizeProductRecord(item) {
  if (!isProductLikeRecord(item)) return null;
  const id = Number(item.id);
  if (!Number.isFinite(id)) return null;
  return {
    ...item,
    id,
    name: item.name || item.title || '',
    price: Number(item.price) || 0,
    image: item.image || '',
    category: item.category || null,
    quantity: Number(item.quantity) || 0,
    supplier_id: item.supplier_id || null,
    supplier_name: item.supplier_name || null,
  };
}

function mergeProductsById(sources) {
  const merged = new Map();
  (Array.isArray(sources) ? sources : []).forEach((source) => {
    (Array.isArray(source) ? source : []).forEach((item) => {
      const normalized = normalizeProductRecord(item);
      if (!normalized) return;
      const current = merged.get(normalized.id) || {};
      merged.set(normalized.id, {
        ...current,
        ...normalized,
      });
    });
  });
  return Array.from(merged.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

function getActiveMemoryPromotionByProductId(productId) {
  const promos = Array.isArray(memory.promotions) ? memory.promotions : [];
  return promos
    .filter(p => Number(p.product_id) === Number(productId))
    .find(p => normalizePromotionState(p) === 'activa' && (Number(p.stock_promocion_restante) || 0) > 0) || null;
}

async function listAdminPromotions() {
  const memoryPromos = (memory.promotions || []).map((promo) => {
    const product = getMemoryProduct({ id: Number(promo.product_id) || NaN });
    return {
      ...promo,
      product_name: promo.product_name || product?.name || null,
      image: promo.image || product?.image || '/img/promo1.webp',
      precio_normal: promo.precio_normal ?? product?.price ?? null,
      estado: normalizePromotionState(promo),
    };
  });

  if (!DB_ENABLED) return memoryPromos;

  try {
    const result = await db.query(`
      SELECT
        pr.id,
        pr.product_id,
        pr.title,
        pr.description,
        pr.image,
        pr.price,
        pr.discount,
        pr.sizes,
        pr.promo_price,
        pr.promo_stock,
        pr.promo_stock_remaining,
        pr.start_at,
        pr.end_at,
        pr.state,
        p.name AS product_name,
        p.price AS normal_price,
        p.image AS product_image
      FROM promotions pr
      LEFT JOIN products p ON p.id = pr.product_id
      ORDER BY pr.id DESC
      LIMIT 200
    `);
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const dbPromos = rows.map((row) => ({
      id: Number(row.id) || row.id,
      product_id: Number(row.product_id) || null,
      title: row.title || row.product_name || null,
      description: row.description || '',
      image: row.image || row.product_image || '/img/promo1.webp',
      sizes: row.sizes || '',
      precio_normal: row.normal_price != null ? Number(row.normal_price) : null,
      precio_promocion: row.promo_price != null ? Number(row.promo_price) : (row.price != null ? Number(row.price) : null),
      stock_promocion: row.promo_stock != null ? Number(row.promo_stock) : 0,
      stock_promocion_restante: row.promo_stock_remaining != null ? Number(row.promo_stock_remaining) : 0,
      fecha_inicio: row.start_at || null,
      fecha_fin: row.end_at || null,
      estado: normalizePromotionState({
        estado: row.state,
        fecha_inicio: row.start_at,
        fecha_fin: row.end_at,
        stock_promocion_restante: row.promo_stock_remaining,
      }),
      product_name: row.product_name || null,
    }));
    return dbPromos;
  } catch (err) {
    return [];
  }
}

// Migración automática de datos en memoria a DB al inicio (idempotente)
async function migrateMemoryToDb() {
  try {
    // Verificar conectividad a DB
    const ping = await db.query('SELECT 1 AS ok');
    if (!ping || !('rows' in ping)) return; // sin DB configurada

    // Helper: obtener COUNT(*) de una tabla
    async function getCount(table) {
      try {
        const r = await db.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
        const first = Array.isArray(r.rows) ? r.rows[0] : null;
        if (!first) return 0;
        return typeof first.cnt === 'number' ? first.cnt : Number(Object.values(first)[0] || 0);
      } catch {
        return 0;
      }
    }

    // Migrar proveedores
    try {
      const suppliersCount = await getCount('suppliers');
      if (suppliersCount === 0 && Array.isArray(memory.suppliers) && memory.suppliers.length > 0) {
        for (const s of memory.suppliers) {
          await db.query(
            'INSERT INTO suppliers(name, contact, email, phone, notes) VALUES(?, ?, ?, ?, ?)',
            [s.name || '', s.contact || null, s.email || null, s.phone || null, s.notes || null]
          );
        }
        console.log(`Migración: proveedores -> ${memory.suppliers.length} registros insertados`);
      }
    } catch (err) {
      console.warn('Migración proveedores omitida:', err?.message || String(err));
    }

    // Migrar productos
    try {
      const productsCount = await getCount('products');
      if (productsCount === 0 && Array.isArray(memory.products) && memory.products.length > 0) {
        for (const p of memory.products) {
          await db.query(
            'INSERT INTO products(name, price, image, category, colors, sizes, quantity) VALUES(?, ?, ?, ?, ?, ?, ?)',
            [p.name || '', Number(p.price || 0), p.image || '', p.category || null, p.colors || '', p.sizes || '', Number(p.quantity || 0)]
          );
        }
        console.log(`Migración: productos -> ${memory.products.length} registros insertados`);
      }
    } catch (err) {
      console.warn('Migración productos omitida:', err?.message || String(err));
    }

    // Migrar promociones
    try {
      const promotionsCount = await getCount('promotions');
      if (promotionsCount === 0 && Array.isArray(memory.promotions) && memory.promotions.length > 0) {
        for (const pr of memory.promotions) {
          await db.query(
            'INSERT INTO promotions(product_id, title, description, image, price, discount, sizes) VALUES(?, ?, ?, ?, ?, ?, ?)',
            [
              pr.product_id != null ? Number(pr.product_id) : null,
              pr.title || '',
              pr.description || null,
              pr.image || '',
              pr.price != null ? Number(pr.price) : null,
              pr.discount != null ? Number(pr.discount) : null,
              pr.sizes ? (Array.isArray(pr.sizes) ? JSON.stringify(pr.sizes) : String(pr.sizes)) : null,
            ]
          );
        }
        console.log(`Migración: promociones -> ${memory.promotions.length} registros insertados`);
      }
    } catch (err) {
      console.warn('Migración promociones omitida:', err?.message || String(err));
    }

    // Migrar pedidos + items
    try {
      const ordersCount = await getCount('orders');
      if (ordersCount === 0 && Array.isArray(memory.orders) && memory.orders.length > 0) {
        for (const o of memory.orders) {
          const ins = await db.query('INSERT INTO orders(customer, status) VALUES(?, ?)', [o.customer || 'anónimo', o.status || 'pendiente']);
          const orderId = ins.insertId;
          if (Array.isArray(o.items)) {
            for (const it of o.items) {
              await db.query(
                'INSERT INTO order_items(order_id, product_id, name, qty, price, color, talle) VALUES(?, ?, ?, ?, ?, ?, ?)',
                [
                  orderId,
                  it.id != null ? Number(it.id) : null,
                  it.name || '',
                  Number(it.qty || it.quantity || 1),
                  Number(it.price || 0),
                  it.color || '',
                  it.talle || '',
                ]
              );
            }
          }
        }
        console.log(`Migración: pedidos -> ${memory.orders.length} pedidos insertados con sus items`);
      }
    } catch (err) {
      console.warn('Migración pedidos omitida:', err?.message || String(err));
    }

    // Upsert de configuración admin (siempre toma memoria como fuente inicial)
    try {
      const s = memory.settings || {};
      await db.query(
        'INSERT INTO admin_settings(id, min_stock, admin_email, admin_password, admin_name) VALUES(1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE min_stock=VALUES(min_stock), admin_email=VALUES(admin_email), admin_password=VALUES(admin_password), admin_name=VALUES(admin_name)'
      , [Number(s.minStock || 2), s.adminEmail || null, s.adminPassword || null, s.adminName || null]);
      console.log('Migración: admin_settings upsert aplicado desde memoria');
    } catch (err) {
      console.warn('Migración settings omitida:', err?.message || String(err));
    }

    // Upsert de site_home (id=1)
    try {
      const h = (memory.site && memory.site.home) ? memory.site.home : { images: [], captions: [], intervalMs: 3000, pauseOnHover: true };
      await db.query(
        'INSERT INTO site_home(id, images_json, captions_json, interval_ms, pause_on_hover) VALUES(1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE images_json=VALUES(images_json), captions_json=VALUES(captions_json), interval_ms=VALUES(interval_ms), pause_on_hover=VALUES(pause_on_hover)'
      , [JSON.stringify(h.images || []), JSON.stringify(h.captions || []), Number(h.intervalMs || 3000), h.pauseOnHover ? 1 : 0]);
      console.log('Migración: site_home upsert aplicado desde memoria');
    } catch (err) {
      console.warn('Migración site_home omitida:', err?.message || String(err));
    }
  } catch (err) {
    // Sin DB, no migrar
  }
}

// Ejecutar migración automáticamente al inicio (después de asegurar el esquema)
(async () => {
  try {
    await migrateMemoryToDb();
  } catch (err) {
    console.warn('Migración memoria->DB falló al inicio:', err?.message || String(err));
  }
})();

// Registro
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' });
  }
  const userId = email.toLowerCase();
  const referrerRaw = req.body?.referrer ?? req.body?.ref ?? req.query?.ref ?? null;
  const referrer = referrerRaw != null ? String(referrerRaw).trim().toLowerCase() : '';
  
  // Guardar en memoria (e intentar en DB si existe)
  memory.users[userId] = { 
    name: name || email, 
    email: userId, 
    is_verified: false 
  };
  safePersistState();

  if (!memory.auth) memory.auth = {};
  if (!memory.auth.referralPending) memory.auth.referralPending = {};
  if (referrer && referrer !== userId && isEmail(referrer)) {
    memory.auth.referralPending[userId] = referrer;
    safePersistState();
    if (DB_ENABLED) {
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS referral_pending (
            referred_email VARCHAR(255) NOT NULL,
            referrer_email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (referred_email),
            KEY idx_referrer_email (referrer_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
        );
        await db.query(
          'INSERT INTO referral_pending (referred_email, referrer_email) VALUES (?, ?) ON DUPLICATE KEY UPDATE referrer_email = VALUES(referrer_email)',
          [userId, referrer]
        );
      } catch (_) {
        void 0;
      }
    }
  }
  
  try {
    await db.query('INSERT INTO users(name, email, password, is_verified) VALUES(?, ?, ?, 0)', [name, userId, password]);
  } catch (err) { /* ignore if no DB */ }

  // Enviar correo de verificación inmediatamente (sin await para no bloquear)
  const code = generateVerificationCode();
  if (!memory.auth) memory.auth = {};
  if (!memory.auth.verificationCodes) memory.auth.verificationCodes = {};
  memory.auth.verificationCodes[userId] = { code, exp: Date.now() + 30 * 60 * 1000 };
  safePersistState();
  if (DB_ENABLED) {
    try {
      await db.query(
        'INSERT INTO email_verification_tokens (email, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
        [userId, sha256Hex(code)]
      );
    } catch (err) {
      void 0;
    }
  }
  const mailOk = await sendEmailFast({
    to: userId,
    subject: 'Verifica tu cuenta - JJ Indumentaria',
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1E3A8A; text-align: center;">¡Bienvenido a JJ Indumentaria!</h2>
        <p>Gracias por registrarte. Para activar tu cuenta, utiliza el siguiente código de verificación:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1E3A8A; padding: 20px; background: #f0f4ff; border-radius: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #666;">Este código vence en 30 minutos.</p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">Si no realizaste este registro, ignora este correo.</p>
      </div>
    `,
  });

  res.json({
    ok: true,
    userId,
    message: mailOk ? 'Registro exitoso. Revisa tu email para verificar la cuenta.' : 'Registro exitoso. No se pudo enviar el email, usá el código para verificar.',
    ...(mailOk ? {} : { devCode: code }),
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' });
  }
  const userId = email.toLowerCase();
  
  let user = memory.users[userId];
  
  // Si no está en memoria, intentar buscar en DB
  if (!user) {
    try {
      const result = await db.query('SELECT * FROM users WHERE email = ?', [userId]);
      if (result.rows && result.rows[0]) {
        user = result.rows[0];
        memory.users[userId] = { ...user, is_verified: !!user.is_verified };
      }
    } catch (err) { /* ignore */ }
  }

  if (!user) {
    // Si no existe ni en DB ni memoria, auto-provisión para facilitar pruebas
    user = { name: email, email: userId, is_verified: false };
    memory.users[userId] = user;
  }

  if (!user.is_verified) {
    return res.status(403).json({ 
      ok: false, 
      error: 'Cuenta no verificada. Por favor, verifica tu email primero.', 
      userId,
      requires_verification: true 
    });
  }

  res.json({ ok: true, userId });
});

// Panel login por roles
app.post('/api/auth/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@jj.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const emailNorm = (email || '').trim().toLowerCase();
  const adminEmailNorm = (adminEmail || '').trim().toLowerCase();
  const passNorm = (password || '').trim();
  const adminPassNorm = (adminPassword || '').trim();

  if (emailNorm === adminEmailNorm && passNorm === adminPassNorm) {
    const { token, session } = createPanelSession({ email: adminEmailNorm, name: memory.settings.adminName, role: 'admin' });
    return res.json({ ok: true, token, name: session.name, role: session.role, email: session.email });
  }

  const panelUser = await findPanelUserByEmail(emailNorm);
  if (!panelUser || !PANEL_ROLES.has(panelUser.role)) {
    return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
  }
  if (!panelUser.is_verified) {
    return res.status(403).json({ ok: false, error: 'La cuenta todavía no está verificada' });
  }
  if (!isPasswordMatch(panelUser.password, passNorm)) {
    return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
  }

  const { token, session } = createPanelSession(panelUser);
  res.json({ ok: true, token, name: session.name, role: session.role, email: session.email });
});

app.get('/api/auth/admin/session', requireProductsView, (req, res) => {
  const session = req.panelSession || null;
  if (!session) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
  res.json({
    ok: true,
    session: {
      name: session.name || '',
      email: session.email || '',
      role: normalizePanelRole(session.role),
    },
  });
});

// Admin: obtener productos (incluye memoria cuando no hay DB)
app.get('/api/admin/products', requireProductsView, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.name, p.price, p.image, p.category, p.colors, p.sizes, p.quantity, p.supplier_id, s.name AS supplier_name 
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id
    `);
    const rows = result.rows && result.rows.length ? result.rows : [];
    res.json(rows);
  } catch (err) {
    if (!DB_ENABLED) {
      return res.json(mergeProductsById([Array.isArray(memory.products) ? memory.products : []]));
    }
    res.status(500).json({ ok: false, error: 'DB no disponible' });
  }
});

// Admin: crear producto con imagen base64
app.post('/api/admin/products', requireProductManagement, async (req, res) => {
  const { name, price, category, imageBase64, quantity, supplier_id, colors, sizes } = req.body || {};
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ ok: false, error: 'Datos de producto inválidos' });
  }
  const imageValue = (typeof imageBase64 === 'string' && imageBase64.trim())
    ? imageBase64
    : '/img/1.webp';
  const colorsText = colors != null ? String(colors).trim() : '';
  const sizesText = sizes != null ? String(sizes).trim() : '';
  try {
    const result = await db.query(
      'INSERT INTO products(name, price, image, category, colors, sizes, quantity, supplier_id) VALUES(?, ?, ?, ?, ?, ?, COALESCE(?, 0), ?)',
      [name, price, imageValue, category || null, colorsText, sizesText, typeof quantity === 'number' ? quantity : 0, supplier_id || null]
    );
    const id = result.insertId;
    if (!id) throw new Error('No id from DB');
    safePersistState();
    return res.json({ ok: true, id });
  } catch (err) {
    const memId = (memory.products.length ? memory.products[memory.products.length - 1].id + 1 : 1000);
    const prod = { id: memId, name, price, category: category || '', colors: colorsText, sizes: sizesText, image: imageValue, quantity: typeof quantity === 'number' ? quantity : 0, supplier_id: supplier_id || null, soldCount: 0 };
    memory.products.push(prod);
    safePersistState();
    return res.json({ ok: true, id: memId, stored: 'memory' });
  }
});

// Admin: actualizar producto
app.put('/api/admin/products/:id', requireProductsView, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, price, category, imageBase64, quantity, supplier_id, colors, sizes } = req.body || {};
  if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });
  const role = req.panelSession?.role;
  const colorsText = colors != null ? String(colors).trim() : null;
  const sizesText = sizes != null ? String(sizes).trim() : null;
  try {
    if (role === 'stock') {
      const result = await db.query(
        'UPDATE products SET quantity = COALESCE(?, quantity) WHERE id = ?',
        [typeof quantity === 'number' ? quantity : null, id]
      );
      if (result.affectedRows && result.affectedRows > 0) {
        safePersistState();
        return res.json({ ok: true, id });
      }
      throw new Error('No DB row updated');
    }
    const result = await db.query(
      'UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), image = COALESCE(?, image), category = COALESCE(?, category), colors = COALESCE(?, colors), sizes = COALESCE(?, sizes), quantity = COALESCE(?, quantity), supplier_id = COALESCE(?, supplier_id) WHERE id = ?',
      [name || null, typeof price === 'number' ? price : null, imageBase64 || null, category || null, colorsText, sizesText, typeof quantity === 'number' ? quantity : null, supplier_id || null, id]
    );
    if (result.affectedRows && result.affectedRows > 0) {
      safePersistState();
      return res.json({ ok: true, id });
    }
    throw new Error('No DB row updated');
  } catch (err) {
    const idx = memory.products.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    const current = memory.products[idx];
    memory.products[idx] = role === 'stock'
      ? {
          ...current,
          quantity: typeof quantity === 'number' ? quantity : (current.quantity ?? 0),
        }
      : {
          ...current,
          name: name ?? current.name,
          price: typeof price === 'number' ? price : current.price,
          image: imageBase64 ?? current.image,
          category: category ?? current.category,
          colors: colorsText ?? current.colors ?? '',
          sizes: sizesText ?? current.sizes ?? '',
          quantity: typeof quantity === 'number' ? quantity : (current.quantity ?? 0),
          supplier_id: supplier_id ?? current.supplier_id,
        };
    safePersistState();
    return res.json({ ok: true, id, stored: 'memory' });
  }
});

// Admin: eliminar producto
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (err) {
    const idx = memory.products.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    memory.products.splice(idx, 1);
    safePersistState();
    return res.json({ ok: true, stored: 'memory' });
  }
});

// Admin/Stock: devoluciones (registrar y listar)
app.get('/api/admin/returns', requireInventoryAccess, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.product_id, p.name AS product_name, r.qty, r.reason, r.order_id,
              r.created_by_email, r.created_by_name, r.created_at
       FROM \`returns\` r
       LEFT JOIN products p ON p.id = r.product_id
       ORDER BY r.id DESC
       LIMIT 200`
    );
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const extra = Array.isArray(memory.returns) ? memory.returns : [];
    const combined = [...rows, ...extra];
    combined.sort((a, b) => {
      const ta = new Date(a?.created_at || 0).getTime();
      const tb = new Date(b?.created_at || 0).getTime();
      if (tb !== ta) return tb - ta;
      return (Number(b?.id) || 0) - (Number(a?.id) || 0);
    });
    res.json(combined.slice(0, 200));
  } catch (err) {
    res.json(Array.isArray(memory.returns) ? memory.returns : []);
  }
});

app.post('/api/admin/returns', requireInventoryAccess, async (req, res) => {
  const { productId, productName, qty, reason, orderId } = req.body || {};
  const pid = productId != null && String(productId).trim() !== '' ? Number.parseInt(productId, 10) : NaN;
  const pname = productName != null ? String(productName).trim() : '';
  const q = Number.parseInt(qty, 10);
  if (!pname || Number.isNaN(q) || q <= 0) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  }
  const session = req.panelSession || {};
  const reasonText = reason != null ? String(reason).trim() : null;
  const orderIdText = orderId != null ? String(orderId).trim() : null;

  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS \`returns\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`product_id\` INT UNSIGNED NOT NULL,
        \`qty\` INT NOT NULL,
        \`reason\` TEXT NULL,
        \`order_id\` VARCHAR(50) NULL,
        \`created_by_email\` VARCHAR(255) NULL,
        \`created_by_name\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_returns_product\` (\`product_id\`),
        KEY \`idx_returns_created_at\` (\`created_at\`),
        CONSTRAINT \`fk_returns_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
    );

    let resolved = null;
    const exactRes = await db.query('SELECT id, name FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1', [pname]);
    resolved = Array.isArray(exactRes.rows) ? exactRes.rows[0] : null;
    if (!resolved) {
      const likeRes = await db.query(
        'SELECT id, name FROM products WHERE LOWER(name) LIKE LOWER(?) ORDER BY LENGTH(name) ASC, id ASC LIMIT 6',
        [`%${pname}%`]
      );
      const candidates = Array.isArray(likeRes.rows) ? likeRes.rows : [];
      if (candidates.length === 1) {
        resolved = candidates[0];
      } else if (candidates.length > 1) {
        return res.status(409).json({
          ok: false,
          error: 'Hay más de un producto que coincide con ese nombre. Especificá mejor el nombre.',
          matches: candidates.slice(0, 5).map(row => row.name),
        });
      }
    }
    const resolvedId = resolved ? Number.parseInt(resolved.id, 10) : NaN;
    const productRow = Number.isFinite(resolvedId) ? resolved : null;
    if (!productRow) throw new Error('PRODUCT_NOT_FOUND');

    await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [q, resolvedId]);
    const ins = await db.query(
      'INSERT INTO `returns`(product_id, qty, reason, order_id, created_by_email, created_by_name) VALUES(?, ?, ?, ?, ?, ?)',
      [resolvedId, q, reasonText || null, orderIdText || null, session.email || null, session.name || null]
    );
    safePersistState();
    return res.json({ ok: true, id: ins.insertId || null });
  } catch (err) {
    const normalized = pname.toLowerCase();
    let idx = memory.products.findIndex(p => String(p?.name || '').trim().toLowerCase() === normalized);
    if (idx < 0) {
      const candidates = memory.products
        .filter(p => String(p?.name || '').trim().toLowerCase().includes(normalized))
        .slice(0, 6);
      if (candidates.length === 1) {
        idx = memory.products.findIndex(p => Number(p?.id) === Number(candidates[0]?.id));
      } else if (candidates.length > 1) {
        return res.status(409).json({
          ok: false,
          error: 'Hay más de un producto que coincide con ese nombre. Especificá mejor el nombre.',
          matches: candidates.slice(0, 5).map(p => p?.name || ''),
        });
      }
    }
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    const resolvedId = Number(memory.products[idx]?.id);

    const currentQty = Number(memory.products[idx]?.quantity) || 0;
    memory.products[idx].quantity = currentQty + q;
    const item = {
      id: Date.now(),
      product_id: resolvedId,
      product_name: memory.products[idx]?.name || '',
      qty: q,
      reason: reasonText || '',
      order_id: orderIdText || '',
      created_by_email: session.email || '',
      created_by_name: session.name || '',
      created_at: new Date().toISOString(),
      stored: 'memory',
    };
    if (!Array.isArray(memory.returns)) memory.returns = [];
    memory.returns.unshift(item);
    safePersistState();
    return res.json({ ok: true, id: item.id, stored: 'memory' });
  }
});

app.get('/api/admin/order-returns', requireOrdersAccess, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.order_id, r.order_item_id, r.product_id, r.product_name, r.color, r.talle, r.qty, r.reason, r.status,
              r.requested_by_email, r.requested_by_name, r.decided_by_email, r.decided_by_name, r.decided_at,
              r.received_by_email, r.received_by_name, r.received_at, r.refunded_by_email, r.refunded_by_name, r.refunded_at,
              r.created_at, r.updated_at,
              o.customer_email, o.customer_name, o.customer_lastname
       FROM order_returns r
       LEFT JOIN orders o ON o.id = r.order_id
       ORDER BY r.id DESC
       LIMIT 300`
    );
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const extra = Array.isArray(memory.orderReturns) ? memory.orderReturns : [];
    const byId = new Map();
    for (const item of [...rows, ...extra]) {
      const key = String(item?.id || '');
      if (!key) continue;
      if (!byId.has(key)) byId.set(key, item);
    }
    const combined = Array.from(byId.values());
    combined.sort((a, b) => {
      const ta = new Date(a?.created_at || a?.createdAt || 0).getTime();
      const tb = new Date(b?.created_at || b?.createdAt || 0).getTime();
      if (tb !== ta) return tb - ta;
      return (Number(b?.id) || 0) - (Number(a?.id) || 0);
    });
    res.json(combined.slice(0, 300));
  } catch (err) {
    res.json(Array.isArray(memory.orderReturns) ? memory.orderReturns : []);
  }
});

app.post('/api/admin/order-returns', requireSalesAccess, async (req, res) => {
  const session = req.panelSession || {};
  const orderId = Number.parseInt(req.body?.orderId, 10);
  const orderItemId = Number.parseInt(req.body?.orderItemId, 10);
  const qty = Number.parseInt(req.body?.qty, 10);
  const reasonText = req.body?.reason != null ? String(req.body.reason).trim() : null;
  if (Number.isNaN(orderId) || Number.isNaN(orderItemId) || Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  }

  try {
    const itemRes = await db.query('SELECT id, order_id, product_id, name, qty, color, talle FROM order_items WHERE id = ? LIMIT 1', [orderItemId]);
    let item = Array.isArray(itemRes.rows) ? itemRes.rows[0] : null;
    if (!item) {
      const byProductRes = await db.query(
        'SELECT id, order_id, product_id, name, qty, color, talle FROM order_items WHERE order_id = ? AND product_id = ? ORDER BY id ASC LIMIT 2',
        [orderId, orderItemId]
      );
      const candidates = Array.isArray(byProductRes.rows) ? byProductRes.rows : [];
      if (candidates.length === 1) {
        item = candidates[0];
      } else if (candidates.length > 1) {
        return res.status(409).json({
          ok: false,
          error: 'Hay más de un item del mismo producto en el pedido. Elegí el item exacto.',
          matches: candidates.map((c) => ({ id: c.id, name: c.name, color: c.color, talle: c.talle, qty: c.qty })),
        });
      }
    }
    if (!item || Number(item.order_id) !== orderId) {
      throw new Error('ORDER_ITEM_NOT_FOUND');
    }
    const maxQty = Number(item.qty) || 0;
    if (qty > maxQty) {
      return res.status(400).json({ ok: false, error: `La cantidad máxima para devolver es ${maxQty}` });
    }

    const ins = await db.query(
      'INSERT INTO order_returns(order_id, order_item_id, product_id, product_name, color, talle, qty, reason, status, requested_by_email, requested_by_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderId,
        orderItemId,
        item.product_id || null,
        item.name || '',
        item.color || '',
        item.talle || '',
        qty,
        reasonText || null,
        'solicitada',
        session.email || null,
        session.name || null,
      ]
    );
    safePersistState();
    return res.json({ ok: true, id: ins.insertId || null });
  } catch (err) {
    normalizeMemoryOrdersItems();
    const order = Array.isArray(memory.orders) ? memory.orders.find(o => Number(o?.id) === orderId) : null;
    const items = Array.isArray(order?.items) ? order.items : [];
    let item = items.find(it => Number(it?.id) === orderItemId) || null;
    if (!item) {
      const candidates = items.filter(it => Number(it?.product_id ?? it?.productId) === orderItemId);
      if (candidates.length === 1) item = candidates[0];
      else if (candidates.length > 1) {
        return res.status(409).json({
          ok: false,
          error: 'Hay más de un item del mismo producto en el pedido. Elegí el item exacto.',
          matches: candidates.map((c) => ({ id: c.id, name: c.name, color: c.color, talle: c.talle, qty: c.qty })),
        });
      }
    }
    if (!order || !item) return res.status(404).json({ ok: false, error: 'Item de pedido no encontrado' });
    const maxQty = Number(item.qty ?? item.quantity ?? 0) || 0;
    if (qty > maxQty) {
      return res.status(400).json({ ok: false, error: `La cantidad máxima para devolver es ${maxQty}` });
    }
    const nextId = (() => {
      const current = Array.isArray(memory.orderReturns) ? memory.orderReturns : [];
      const max = current.reduce((acc, r) => Math.max(acc, Number(r?.id) || 0), 0);
      return Math.max(1000000, max + 1);
    })();
    const rec = {
      id: nextId,
      order_id: orderId,
      order_item_id: orderItemId,
      product_id: item.product_id || item.id || null,
      product_name: item.name || '',
      color: item.color || '',
      talle: item.talle || '',
      qty,
      reason: reasonText || '',
      status: 'solicitada',
      requested_by_email: session.email || '',
      requested_by_name: session.name || '',
      created_at: new Date().toISOString(),
      stored: 'memory',
    };
    if (!Array.isArray(memory.orderReturns)) memory.orderReturns = [];
    memory.orderReturns.unshift(rec);
    safePersistState();
    res.json({ ok: true, id: rec.id, stored: 'memory' });
  }
});

app.put('/api/admin/order-returns/:id/status', requireOrdersAccess, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const status = String(req.body?.status || '').trim().toLowerCase();
  if (Number.isNaN(id) || !status) return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  const allowed = new Set(['solicitada', 'aprobada', 'rechazada', 'recibida', 'reembolsada']);
  if (!allowed.has(status)) return res.status(400).json({ ok: false, error: 'Estado inválido' });

  const session = req.panelSession || {};
  const role = normalizePanelRole(session.role);
  const canTransition = (from, to) => {
    if (role === 'admin') return true;
    if (role === 'vendedor') {
      if (from === 'solicitada' && (to === 'aprobada' || to === 'rechazada')) return true;
      if (from === 'recibida' && to === 'reembolsada') return true;
      return false;
    }
    if (role === 'stock') {
      return from === 'aprobada' && to === 'recibida';
    }
    return false;
  };

  try {
    const currentRes = await db.query('SELECT id, status, product_id, qty FROM order_returns WHERE id = ? LIMIT 1', [id]);
    const current = Array.isArray(currentRes.rows) ? currentRes.rows[0] : null;
    if (!current) return res.status(404).json({ ok: false, error: 'Devolución no encontrada' });
    const from = String(current.status || '').toLowerCase();
    if (!canTransition(from, status)) return res.status(403).json({ ok: false, error: 'No tenés permisos para este cambio de estado' });

    const sets = ['status = ?'];
    const params = [status];
    if (status === 'aprobada' || status === 'rechazada') {
      sets.push('decided_by_email = ?', 'decided_by_name = ?', 'decided_at = NOW()');
      params.push(session.email || null, session.name || null);
    }
    if (status === 'recibida') {
      sets.push('received_by_email = ?', 'received_by_name = ?', 'received_at = NOW()');
      params.push(session.email || null, session.name || null);
    }
    if (status === 'reembolsada') {
      sets.push('refunded_by_email = ?', 'refunded_by_name = ?', 'refunded_at = NOW()');
      params.push(session.email || null, session.name || null);
    }
    params.push(id);
    await db.query(`UPDATE order_returns SET ${sets.join(', ')} WHERE id = ?`, params);
    if (status === 'recibida' && current.product_id) {
      await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [Number(current.qty) || 0, Number(current.product_id)]);
    }
    safePersistState();
    return res.json({ ok: true, id, status });
  } catch (err) {
    const list = Array.isArray(memory.orderReturns) ? memory.orderReturns : [];
    const idx = list.findIndex(r => Number(r?.id) === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Devolución no encontrada' });
    const current = list[idx];
    const from = String(current?.status || '').toLowerCase();
    if (!canTransition(from, status)) return res.status(403).json({ ok: false, error: 'No tenés permisos para este cambio de estado' });
    list[idx] = {
      ...current,
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'aprobada' || status === 'rechazada'
        ? { decided_by_email: session.email || '', decided_by_name: session.name || '', decided_at: new Date().toISOString() }
        : {}),
      ...(status === 'recibida'
        ? { received_by_email: session.email || '', received_by_name: session.name || '', received_at: new Date().toISOString() }
        : {}),
      ...(status === 'reembolsada'
        ? { refunded_by_email: session.email || '', refunded_by_name: session.name || '', refunded_at: new Date().toISOString() }
        : {}),
    };
    if (status === 'recibida' && current.product_id) {
      const pIdx = Array.isArray(memory.products) ? memory.products.findIndex(p => Number(p?.id) === Number(current.product_id)) : -1;
      if (pIdx >= 0) {
        const currentQty = Number(memory.products[pIdx]?.quantity) || 0;
        memory.products[pIdx].quantity = currentQty + (Number(current.qty) || 0);
      }
    }
    memory.orderReturns = list;
    safePersistState();
    res.json({ ok: true, id, status, stored: 'memory' });
  }
});

// Admin: registrar venta y ajustar inventario
app.post('/api/admin/sales', requireSalesAccess, async (req, res) => {
  const { productId, productName, quantity, price } = req.body || {};
  const q = parseInt(quantity, 10);
  const id = productId != null ? parseInt(productId, 10) : NaN;
  if (Number.isNaN(q) || q <= 0) return res.status(400).json({ ok: false, error: 'Cantidad inválida' });
  try {
    let product = null;
    if (!Number.isNaN(id)) {
      const r = await db.query('SELECT id, name, price, quantity FROM products WHERE id = ? LIMIT 1', [id]);
      product = Array.isArray(r.rows) ? r.rows[0] : null;
    } else if (productName) {
      const r = await db.query('SELECT id, name, price, quantity FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1', [String(productName).trim()]);
      product = Array.isArray(r.rows) ? r.rows[0] : null;
    } else {
      return res.status(400).json({ ok: false, error: 'Falta productId o productName' });
    }
    if (!product) throw new Error('PRODUCT_NOT_FOUND');

    let activePromo = null;
    try {
      const promoResult = await db.query(
        `SELECT id, promo_price, promo_stock_remaining, state, start_at, end_at
         FROM promotions
         WHERE product_id = ?
         ORDER BY id DESC`,
        [product.id]
      );
      const promoRows = Array.isArray(promoResult.rows) ? promoResult.rows : [];
      activePromo = promoRows.find((row) => normalizePromotionState({
        estado: row.state,
        fecha_inicio: row.start_at,
        fecha_fin: row.end_at,
        stock_promocion_restante: row.promo_stock_remaining,
      }) === 'activa' && (Number(row.promo_stock_remaining) || 0) > 0) || null;
    } catch (_) {
      activePromo = null;
    }

    const generalStock = Number(product.quantity) || 0;
    const promoStock = activePromo ? (Number(activePromo.promo_stock_remaining) || 0) : 0;
    if (q > generalStock + promoStock) {
      return res.status(400).json({
        ok: false,
        error: 'Stock insuficiente para registrar la venta',
        available: generalStock + promoStock,
      });
    }

    const promoQty = activePromo ? Math.min(q, promoStock) : 0;
    const normalQty = q - promoQty;
    const promoUnitPrice = activePromo ? (Number(activePromo.promo_price) || 0) : 0;
    const normalUnitPrice = (Number.isFinite(Number(price)) && Number(price) >= 0) ? Number(price) : (Number(product.price) || 0);

    if (normalQty > 0) {
      await db.query(
        'UPDATE products SET quantity = quantity - ?, sold_count = COALESCE(sold_count,0) + ? WHERE id = ?',
        [normalQty, q, product.id]
      );
    } else {
      await db.query(
        'UPDATE products SET sold_count = COALESCE(sold_count,0) + ? WHERE id = ?',
        [q, product.id]
      );
    }
    if (promoQty > 0) {
      try {
        await db.query(
          `UPDATE promotions
           SET promo_stock_remaining = GREATEST(promo_stock_remaining - ?, 0),
               state = CASE WHEN promo_stock_remaining - ? <= 0 THEN 'agotada' ELSE state END
           WHERE id = ?`,
          [promoQty, promoQty, activePromo.id]
        );
      } catch (_) {
        void 0;
      }
    }

    const saleTs = new Date().toISOString();
    const saleItems = [];
    if (promoQty > 0) {
      saleItems.push({
        id: Date.now(),
        productId: Number(product.id) || null,
        promotionId: Number(activePromo.id) || null,
        name: product.name,
        quantity: promoQty,
        price: promoUnitPrice,
        total: promoQty * promoUnitPrice,
        tipo_precio: 'promocion',
        ts: saleTs,
      });
    }
    if (normalQty > 0) {
      saleItems.push({
        id: Date.now() + 1,
        productId: Number(product.id) || null,
        promotionId: null,
        name: product.name,
        quantity: normalQty,
        price: normalUnitPrice,
        total: normalQty * normalUnitPrice,
        tipo_precio: 'normal',
        ts: saleTs,
      });
    }

    memory.sales.push(...saleItems);
    safePersistState();

    let anyDbInsertFailed = false;
    for (const item of saleItems) {
      try {
        await db.query(
          'INSERT INTO sales (product_id, promotion_id, name, qty, price, total, price_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.productId, item.promotionId, item.name, item.quantity, item.price, item.total, item.tipo_precio]
        );
      } catch (err) {
        anyDbInsertFailed = true;
        const code = err?.code || '';
        if (typeof db.ensureSchema === 'function' && (code === 'ER_NO_SUCH_TABLE' || code === 'ER_BAD_FIELD_ERROR')) {
          try {
            await db.ensureSchema();
            await db.query(
              'INSERT INTO sales (product_id, promotion_id, name, qty, price, total, price_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [item.productId, item.promotionId, item.name, item.quantity, item.price, item.total, item.tipo_precio]
            );
            anyDbInsertFailed = false;
            continue;
          } catch (err2) {
            anyDbInsertFailed = true;
            console.error('Error al insertar en tabla sales:', err2?.message || String(err2));
          }
        } else {
          console.error('Error al insertar en tabla sales:', err.message);
        }
      }
    }
    return res.json({ ok: true, stored: anyDbInsertFailed ? 'memory' : 'db', items: saleItems });
  } catch (err) {
    console.error('Error en POST /api/admin/sales (DB fallback):', err.message);
    const target = getMemoryProduct({ id, productName });
    if (!target) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    const promo = getActiveMemoryPromotionByProductId(target.id);
    const generalStock = Number(target.quantity) || 0;
    const promoStock = promo ? (Number(promo.stock_promocion_restante) || 0) : 0;
    if (q > generalStock + promoStock) {
      return res.status(400).json({ ok: false, error: 'Stock insuficiente para registrar la venta' });
    }
    const promoQty = promo ? Math.min(q, promoStock) : 0;
    const normalQty = q - promoQty;
    if (normalQty > 0) {
      target.quantity = Math.max(generalStock - normalQty, 0);
    }
    if (promoQty > 0 && promo) {
      promo.stock_promocion_restante = Math.max((Number(promo.stock_promocion_restante) || 0) - promoQty, 0);
      promo.estado = promo.stock_promocion_restante <= 0 ? 'agotada' : 'activa';
    }
    target.soldCount = (target.soldCount || 0) + q;
    const saleTs = new Date().toISOString();
    const saleItems = [];
    if (promoQty > 0) {
      const promoUnitPrice = Number(promo?.precio_promocion) || 0;
      saleItems.push({ id: Date.now(), productId: target.id || null, promotionId: promo?.id || null, name: target.name, quantity: promoQty, price: promoUnitPrice, total: promoQty * promoUnitPrice, tipo_precio: 'promocion', ts: saleTs });
    }
    if (normalQty > 0) {
      const unitPrice2 = (Number.isFinite(Number(price)) && Number(price) >= 0) ? Number(price) : (Number(target.price) || 0);
      saleItems.push({ id: Date.now() + 1, productId: target.id || null, promotionId: null, name: target.name, quantity: normalQty, price: unitPrice2, total: normalQty * unitPrice2, tipo_precio: 'normal', ts: saleTs });
    }
    memory.sales.push(...saleItems);
    safePersistState();
    return res.json({ ok: true, stored: 'memory', items: saleItems });
  }
});

// Admin: estadísticas sencillas
app.get('/api/admin/stats', requireSalesAccess, async (req, res) => {
  // Si hay DB, calcular ingresos desde tabla sales
  if (DB_ENABLED) {
    try {
      const r1 = await db.query('SELECT COUNT(*) AS cnt FROM products');
      const r2 = await db.query('SELECT COALESCE(SUM(quantity),0) AS inv FROM products');
      const r3 = await db.query('SELECT COALESCE(SUM(total),0) AS revenue FROM sales');
      const totalProducts = (Array.isArray(r1.rows) && r1.rows[0]) ? Number(r1.rows[0].cnt) : 0;
      const totalInventory = (Array.isArray(r2.rows) && r2.rows[0]) ? Number(r2.rows[0].inv) : 0;
      const revenue = (Array.isArray(r3.rows) && r3.rows[0]) ? Number(r3.rows[0].revenue) : 0;
      // soldCount puede no existir en DB; usar aproximación desde sales.qty
      const r4 = await db.query('SELECT COALESCE(SUM(qty),0) AS units FROM sales');
      const totalSales = (Array.isArray(r4.rows) && r4.rows[0]) ? Number(r4.rows[0].units) : 0;
      return res.json({ totalProducts, totalInventory, totalSales, revenue });
    } catch (_) {
      // fallback a memoria
    }
  }
  const list = memory.products || [];
  const totalProducts = list.length;
  const totalInventory = list.reduce((acc, p) => acc + (typeof p.quantity === 'number' ? p.quantity : 0), 0);
  const totalSales = list.reduce((acc, p) => acc + (typeof p.soldCount === 'number' ? p.soldCount : 0), 0);
  const revenue = list.reduce((acc, p) => acc + ((typeof p.soldCount === 'number' ? p.soldCount : 0) * (typeof p.price === 'number' ? p.price : 0)), 0);
  res.json({ totalProducts, totalInventory, totalSales, revenue });
});

// Admin: log de ventas
app.get('/api/admin/sales/log', requireSalesAccess, (req, res) => {
  const fallback = (memory.sales || []).slice().sort((a, b) => (b.id - a.id)).slice(0, 200);
  if (!DB_ENABLED) return res.json(fallback);
  db.query('SELECT id, product_id AS productId, promotion_id AS promotionId, name, qty AS quantity, price, total, price_type AS tipo_precio, ts FROM sales ORDER BY id DESC LIMIT 200')
    .then(r => Array.isArray(r.rows) ? res.json(r.rows) : res.json(fallback))
    .catch(() => res.json(fallback));
});

// Admin: series de ventas por día
app.get('/api/admin/sales/series', requireSalesAccess, async (req, res) => {
  const range = String(req.query.range || '30d').toLowerCase();
  const days = range === '7d' ? 7 : 30;
  if (!DB_ENABLED) {
    // Agrupar memoria por día
    const byDay = {};
    (memory.sales || []).forEach(s => {
      const d = (s.ts || new Date().toISOString()).slice(0,10);
      byDay[d] = byDay[d] || { date: d, revenue: 0, units: 0 };
      byDay[d].revenue += Number(s.total)||0;
      byDay[d].units += Number(s.quantity)||0;
    });
    // Completar días faltantes
    const out = [];
    for (let i=days-1;i>=0;i--) {
      const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
      out.push(byDay[d] || { date:d, revenue:0, units:0 });
    }
    return res.json({ ok:true, series: out });
  }
  try {
    const r = await db.query(
      `SELECT DATE(ts) AS d, COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(qty),0) AS units
       FROM sales
       WHERE ts >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(ts)
       ORDER BY d ASC`, [days]
    );
    const rows = Array.isArray(r.rows) ? r.rows : [];
    const map = new Map();
    rows.forEach(x => {
      // Intentar obtener la fecha en formato YYYY-MM-DD
      let dateKey = '';
      const d = x.d instanceof Date ? x.d : (x.d ? new Date(x.d) : null);
      if (d && !isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateKey = `${year}-${month}-${day}`;
      }
      if (dateKey) {
        map.set(dateKey, {
          date: dateKey,
          revenue: Number(x.revenue) || 0,
          units: Number(x.units) || 0
        });
      }
    });
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      // Usar fecha local para evitar problemas con UTC/ISO
      const d = new Date(now.getTime() - i * 86400000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      out.push(map.get(dateKey) || { date: dateKey, revenue: 0, units: 0 });
    }
    res.json({ ok: true, series: out });
  } catch (err) {
    res.status(500).json({ ok:false, error: err?.message || 'Error series' });
  }
});

// Obtener carrito
async function getCartItems(userId) {
  const uid = (userId || 'guest').toLowerCase();
  if (uid === 'guest') return memory.carts[uid] || [];
  if (!DB_ENABLED) return memory.carts[uid] || [];
  try {
    const r = await db.query(
      'SELECT product_id AS id, name, price, image, quantity, color, talle, description FROM cart_items WHERE user_email = ? ORDER BY updated_at DESC, id DESC',
      [uid]
    );
    const rows = Array.isArray(r.rows) ? r.rows : [];
    const list = rows.map(it => ({
      id: Number(it.id) || it.id,
      name: it.name,
      price: Number(it.price) || 0,
      image: it.image || null,
      quantity: Number(it.quantity) || 1,
      color: it.color || undefined,
      talle: it.talle || undefined,
      description: it.description || undefined,
    }));
    memory.carts[uid] = list;
    return list;
  } catch (err) {
    return memory.carts[uid] || [];
  }
}

app.get('/api/cart', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const cart = await getCartItems(userId);
  res.json(cart);
});

// Agregar item al carrito
app.post('/api/cart', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const { id, name, price, image, quantity = 1, color, talle, description } = req.body || {};
  if (!id || !name || typeof price !== 'number') {
    return res.status(400).json({ ok: false, error: 'Datos de producto inválidos' });
  }
  memory.carts[userId] = memory.carts[userId] || [];
  const colorNorm = typeof color === 'string' ? color : '';
  const talleNorm = typeof talle === 'string' ? talle : '';
  const existingIdx = memory.carts[userId].findIndex(p => p.id === id && (p.color || '') === colorNorm && (p.talle || '') === talleNorm);
  if (existingIdx >= 0) {
    memory.carts[userId][existingIdx].quantity += quantity;
    // Actualizar variantes si se proporcionan
    if (typeof color !== 'undefined') memory.carts[userId][existingIdx].color = color;
    if (typeof talle !== 'undefined') memory.carts[userId][existingIdx].talle = talle;
    if (typeof description !== 'undefined') memory.carts[userId][existingIdx].description = description;
  } else {
    const item = { id, name, price, image, quantity };
    if (typeof color !== 'undefined') item.color = color;
    if (typeof talle !== 'undefined') item.talle = talle;
    if (typeof description !== 'undefined') item.description = description;
    memory.carts[userId].push(item);
  }
  if (DB_ENABLED && userId !== 'guest') {
    try {
      const priceNorm = Math.round(Number(price) || 0);
      const qtyNorm = Math.max(1, Math.round(Number(quantity) || 1));
      await db.query(
        'INSERT INTO cart_items (user_email, product_id, name, price, image, quantity, color, talle, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), name = VALUES(name), price = VALUES(price), image = VALUES(image), description = VALUES(description)',
        [userId, Number(id) || id, String(name), priceNorm, image || null, qtyNorm, colorNorm, talleNorm, description || null]
      );
    } catch (err) {
      void 0;
    }
  }
  res.json({ ok: true });
});

// Actualizar cantidad de un item
app.patch('/api/cart/:index', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const idx = parseInt(req.params.index, 10);
  const { quantity } = req.body || {};
  const cart = memory.carts[userId] || [];
  if (Number.isNaN(idx) || idx < 0 || idx >= cart.length) {
    return res.status(404).json({ ok: false, error: 'Item no encontrado' });
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ ok: false, error: 'Cantidad inválida' });
  }
  cart[idx].quantity = quantity;
  if (DB_ENABLED && userId !== 'guest') {
    try {
      const it = cart[idx];
      await db.query(
        'UPDATE cart_items SET quantity = ? WHERE user_email = ? AND product_id = ? AND color = ? AND talle = ?',
        [
          Math.max(1, Math.round(Number(quantity) || 1)),
          userId,
          Number(it.id) || it.id,
          typeof it.color === 'string' ? it.color : '',
          typeof it.talle === 'string' ? it.talle : '',
        ]
      );
    } catch (err) {
      void 0;
    }
  }
  res.json({ ok: true });
});

// Eliminar item del carrito
app.delete('/api/cart/:index', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const idx = parseInt(req.params.index, 10);
  const cart = memory.carts[userId] || [];
  if (Number.isNaN(idx) || idx < 0 || idx >= cart.length) {
    return res.status(404).json({ ok: false, error: 'Item no encontrado' });
  }
  const removed = cart[idx];
  cart.splice(idx, 1);
  memory.carts[userId] = cart;
  if (DB_ENABLED && userId !== 'guest') {
    try {
      await db.query(
        'DELETE FROM cart_items WHERE user_email = ? AND product_id = ? AND color = ? AND talle = ?',
        [
          userId,
          Number(removed.id) || removed.id,
          typeof removed.color === 'string' ? removed.color : '',
          typeof removed.talle === 'string' ? removed.talle : '',
        ]
      );
    } catch (err) {
      void 0;
    }
  }
  res.json({ ok: true });
});

// Vaciar carrito
app.delete('/api/cart', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  memory.carts[userId] = [];
  if (DB_ENABLED && userId !== 'guest') {
    try {
      await db.query('DELETE FROM cart_items WHERE user_email = ?', [userId]);
    } catch (err) {
      void 0;
    }
  }
  res.json({ ok: true });
});

// --- Pagos: Mercado Pago ---
app.post('/api/payments/mp/preference', async (req, res) => {
  try {
    if (!mpClient || !mpModules) return res.status(500).json({ ok: false, error: 'SDK de Mercado Pago no configurado' });
    const { Preference } = mpModules;
    const preference = new Preference(mpClient);
    const userId = (req.query.user || req.body.userId || 'guest').toLowerCase();
    const shipping = req.body?.shipping || {};
    const cart = await getCartItems(userId);
    if (!Array.isArray(cart) || cart.length === 0) return res.status(400).json({ ok: false, error: 'Carrito vacío' });
    const items = cart.map(it => ({
      title: it.name || `Producto ${it.id}`,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.price) || 0,
      currency_id: 'ARS',
    }));
    const total = items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
    const shipCost = Number(shipping?.cost) || 0;
    const backBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const notifBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    // Crear pedido pendiente
    const orderId = (memory.orders.length ? memory.orders[memory.orders.length - 1].id + 1 : 1);
    const orderItems = cart.map(it => ({ id: it.id, name: it.name, qty: Number(it.quantity)||1, price: Number(it.price)||0 }));
    const order = { id: orderId, customer: userId, items: orderItems, status: 'pendiente', ts: new Date().toISOString(), shipping: { ...shipping, cost: shipCost }, total: total + shipCost };
    memory.orders.push(order);
    const body = {
      items,
      back_urls: {
        success: `${backBase}/confirmar_compra`,
        failure: `${backBase}/carrito`,
        pending: `${backBase}/carrito`,
      },
      auto_return: 'approved',
      notification_url: `${notifBase}/api/payments/mp/webhook`,
      external_reference: String(orderId),
    };
    const pref = await preference.create({ body });
    const prefId = pref?.id || pref?.body?.id;
    memory.payments.mpPrefs[prefId] = orderId;
    return res.json({ ok: true, init_point: pref?.init_point || pref?.body?.init_point, id: prefId, orderId });
  } catch (err) {
    console.error('MP preference error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'No se pudo crear preferencia' });
  }
});

app.post('/api/payments/mp/webhook', async (req, res) => {
  try {
    if (!mpClient || !mpModules) { res.status(200).json({ ok: true }); return; }
    const { Payment } = mpModules;
    const payment = new Payment(mpClient);
    const id = req.body?.data?.id || req.query?.id || req.body?.id;
    const topic = req.body?.type || req.query?.topic;
    if (!id || (topic && topic !== 'payment')) { res.status(200).json({ ok: true }); return; }
    const info = await payment.get({ id });
    const status = info?.status || info?.body?.status;
    const ext = info?.external_reference || info?.body?.external_reference;
    const orderId = Number(ext);
    if (!Number.isNaN(orderId)) {
      const o = memory.orders.find(oo => oo.id === orderId);
      if (o) {
        o.payment = { provider: 'mp', id, status };
        if (status === 'approved') {
          o.status = 'preparando';
          // Enviar correo de confirmación (SIN await)
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          sendEmail({
            to: o.customer,
            subject: `¡Confirmación de pedido #${o.id}! - JJ Indumentaria`,
            html: generateOrderEmailHtml(o, frontendUrl),
          }).catch(e => console.error('Error email MP webhook:', e.message));
        }
        if (status === 'rejected') o.status = 'cancelado';
      }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('MP webhook error:', err?.message || err);
    res.status(200).json({ ok: true });
  }
});

// Confirmar pedido (para pagos manuales/tarjeta clásica)
app.post('/api/orders/confirm', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const { items, summary } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Datos de pedido inválidos' });
  }

  const orderId = (memory.orders.length ? memory.orders[memory.orders.length - 1].id + 1 : 1);
  const shipCost = Number(summary?.shipping?.cost) || 0;
  const total = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0) + shipCost;
  const customerEmail = String(summary?.email || '').trim().toLowerCase();
  const recipient = String(summary?.recipient || summary?.name || '').trim();
  const { name: customerName, lastName: customerLastName } = splitName(recipient);

  const order = {
    id: orderId,
    customer: userId,
    customerEmail: isEmail(customerEmail) ? customerEmail : (isEmail(userId) ? userId : ''),
    customerName,
    customerLastName,
    items: items.map(it => ({ id: it.id, name: it.name, color: it.color || '', talle: it.talle || '', qty: it.quantity || 1, price: it.price || 0 })),
    status: 'pendiente',
    ts: new Date().toISOString(),
    shipping: {
      recipient,
      address: summary?.address || 'RETIRO EN LOCAL',
      province: summary?.province || '',
      postalCode: summary?.postalCode || '',
      phone: summary?.phone || '',
      cost: shipCost,
    },
    total,
    paymentMethod: summary?.paymentMethod || 'Manual',
  };

  memory.orders.push(order);

  // Intentar guardar en DB si existe
  try {
    const r = await db.query(
      'INSERT INTO orders (customer, status, total, payment_method, customer_email, customer_name, customer_lastname, shipping_recipient, shipping_address, shipping_province, shipping_postal_code, shipping_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        'pendiente',
        total,
        summary?.paymentMethod || 'Manual',
        isEmail(customerEmail) ? customerEmail : (isEmail(userId) ? userId : null),
        customerName || null,
        customerLastName || null,
        recipient || null,
        summary?.address || 'RETIRO EN LOCAL',
        summary?.province || null,
        summary?.postalCode || null,
        summary?.phone || null,
      ]
    );
    const dbOrderId = r.insertId;
    if (dbOrderId) {
      for (const it of items) {
        await db.query(
          'INSERT INTO order_items (order_id, product_id, name, qty, price, color, talle) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [dbOrderId, it.id || null, it.name, it.quantity || 1, it.price, it.color || '', it.talle || '']
        );
      }
      const loyaltyUser = isEmail(customerEmail) ? customerEmail : (isEmail(userId) ? userId : '');
      if (loyaltyUser) {
        try {
          await db.query(
            `CREATE TABLE IF NOT EXISTS user_loyalty (
              user_email VARCHAR(255) NOT NULL,
              referral_points INT NOT NULL DEFAULT 0,
              profile_points INT NOT NULL DEFAULT 0,
              review_points INT NOT NULL DEFAULT 0,
              social_points INT NOT NULL DEFAULT 0,
              spin_credits INT NOT NULL DEFAULT 0,
              profile_completed TINYINT(1) NOT NULL DEFAULT 0,
              last_spin_date DATE NULL,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (user_email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
          );
          await db.query(
            'INSERT INTO user_loyalty (user_email, spin_credits) VALUES (?, 1) ON DUPLICATE KEY UPDATE spin_credits = spin_credits + 1',
            [loyaltyUser]
          );
        } catch (_) {
          void 0;
        }
      }
      console.log(`[DB] Pedido #${dbOrderId} guardado con éxito`);
    }
  } catch (dbErr) {
    console.warn('[DB] No se pudo persistir el pedido:', dbErr.message);
  }

  // Enviar correo de confirmación (SIN await para no colgar la respuesta)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const toEmail = order.customerEmail || (isEmail(userId) ? userId : '');
  sendEmail({
    to: toEmail,
    subject: `¡Confirmación de pedido #${orderId}! - JJ Indumentaria`,
    html: generateOrderEmailHtml(order, frontendUrl),
  }).catch(e => console.error('Error enviando email en pedido:', e.message));

  res.json({ ok: true, orderId });
});

// --- Envíos: Correo Argentino (simulado) ---
app.post('/api/shipping/correo-argentino/quote', (req, res) => {
  const { postalCode, province, weightKg = 1, dimensions = { length: 30, width: 20, height: 10 } } = req.body || {};
  const base = 2500; // base ARS
  const perKg = 150; // por kg
  const zoneSurcharge = (/^(CABA|Buenos Aires)$/i.test(province)) ? 0 : 700;
  const volWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000; // regla volumétrica simple
  const billable = Math.max(Number(weightKg) || 1, volWeight || 1);
  const cost = Math.round(base + perKg * billable + zoneSurcharge);
  const eta = (/^(CABA|Buenos Aires)$/i.test(province)) ? 2 : 4;
  res.json({ ok: true, carrier: 'Correo Argentino', service: 'Domicilio', eta_days: eta, cost });
});

app.post('/api/shipping/correo-argentino/create-shipment', async (req, res) => {
  const { orderId, address, postalCode, province, recipient } = req.body || {};
  if (!orderId || !address || !postalCode || !province || !recipient) return res.status(400).json({ ok: false, error: 'Datos de envío inválidos' });
  const tracking = `CA${Date.now()}`;
  let updated = false;
  try {
    const r = await db.query(
      'UPDATE orders SET shipping_recipient = ?, shipping_address = ?, shipping_province = ?, shipping_postal_code = ?, shipping_carrier = ?, shipping_tracking = ? WHERE id = ?',
      [recipient, address, province, postalCode, 'Correo Argentino', tracking, Number(orderId)]
    );
    if (r.affectedRows && r.affectedRows > 0) updated = true;
  } catch (err) {
    void 0;
  }
  const o = memory.orders.find(oo => oo.id === Number(orderId));
  if (o) {
    o.shipping = { ...(o.shipping || {}), address, postalCode, province, recipient, carrier: 'Correo Argentino', tracking };
    o.status = (o.status === 'preparando' || o.status === 'listo') ? 'enviado' : o.status;
    updated = true;
  }
  if (!updated) return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });
  res.json({ ok: true, tracking });
});

// --- Admin: Pedidos ---
app.get('/api/admin/orders', requireOrdersAccess, async (req, res) => {
  try {
    const ordersRes = await db.query(
      'SELECT id, customer, customer_email, customer_name, customer_lastname, status, total, payment_method, shipping_recipient, shipping_address, shipping_province, shipping_postal_code, shipping_phone, shipping_carrier, shipping_tracking, created_at, updated_at FROM orders ORDER BY id DESC'
    );
    const ordersRows = Array.isArray(ordersRes.rows) ? ordersRes.rows : [];
    if (ordersRows.length) {
      const ids = ordersRows.map(o => o.id);
      const placeholders = ids.map(() => '?').join(',');
      const itemsRes = await db.query(`SELECT id, order_id, product_id, name, qty, price, color, talle FROM order_items WHERE order_id IN (${placeholders})`, ids);
      const items = Array.isArray(itemsRes.rows) ? itemsRes.rows : [];
      const grouped = ordersRows.map(o => ({
        id: o.id,
        customer: o.customer,
        customerEmail: o.customer_email || (isEmail(o.customer) ? o.customer : ''),
        customerName: o.customer_name || '',
        customerLastName: o.customer_lastname || '',
        status: o.status,
        total: typeof o.total === 'number' ? o.total : Number(o.total) || 0,
        paymentMethod: o.payment_method || null,
        created_at: o.created_at,
        updated_at: o.updated_at,
        shipping: {
          recipient: o.shipping_recipient || '',
          address: o.shipping_address || '',
          province: o.shipping_province || '',
          postalCode: o.shipping_postal_code || '',
          phone: o.shipping_phone || '',
          carrier: o.shipping_carrier || '',
          tracking: o.shipping_tracking || '',
        },
        items: items.filter(it => it.order_id === o.id),
      }));
      return res.json(grouped);
    }
    return res.json([]);
  } catch (err) {
    if (!DB_ENABLED) {
      normalizeMemoryOrdersItems();
      return res.json(memory.orders);
    }
  }
  res.status(500).json({ ok: false, error: 'DB no disponible' });
});

app.post('/api/admin/orders', requireSalesAccess, async (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Datos de pedido inválidos' });
  }
  try {
    const r = await db.query('INSERT INTO orders (customer, status) VALUES (?, ?)', [customer, 'pendiente']);
    const orderId = r.insertId;
    for (const it of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, name, qty, price, color, talle) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, it.id || null, it.name || '', Number(it.qty) || 0, Number(it.price) || 0, it.color || '', it.talle || '']
      );
    }
    // Crédito de ruleta por compra (memoria)
    const uid = (customer || 'guest').toLowerCase();
    memory.loyaltyFlags[uid] = memory.loyaltyFlags[uid] || { profileCompleted: false, lastSpinDate: null, spinCredits: 0 };
    memory.loyaltyFlags[uid].spinCredits = (Number(memory.loyaltyFlags[uid].spinCredits) || 0) + 1;
    if (isEmail(uid)) {
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS user_loyalty (
            user_email VARCHAR(255) NOT NULL,
            referral_points INT NOT NULL DEFAULT 0,
            profile_points INT NOT NULL DEFAULT 0,
            review_points INT NOT NULL DEFAULT 0,
            social_points INT NOT NULL DEFAULT 0,
            spin_credits INT NOT NULL DEFAULT 0,
            profile_completed TINYINT(1) NOT NULL DEFAULT 0,
            last_spin_date DATE NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
        );
        await db.query(
          'INSERT INTO user_loyalty (user_email, spin_credits) VALUES (?, 1) ON DUPLICATE KEY UPDATE spin_credits = spin_credits + 1',
          [uid]
        );
      } catch (_) {
        void 0;
      }
    }
    return res.json({ ok: true, id: orderId });
  } catch (err) {
    if (DB_ENABLED) {
      return res.status(500).json({ ok: false, error: 'DB no disponible' });
    }
    const id = (memory.orders.length ? memory.orders[memory.orders.length - 1].id + 1 : 1);
    const nextItemBaseId = (() => {
      const list = Array.isArray(memory.orders) ? memory.orders : [];
      let max = 0;
      for (const order of list) {
        const its = Array.isArray(order?.items) ? order.items : [];
        for (const it of its) {
          max = Math.max(max, Number(it?.id) || 0);
        }
      }
      return Math.max(1000000, max + 1);
    })();
    const normalizedItems = items.map((it, idx) => ({
      id: nextItemBaseId + idx,
      product_id: it?.id ?? it?.product_id ?? it?.productId ?? null,
      name: it?.name || '',
      qty: Number(it?.qty) || 0,
      price: Number(it?.price) || 0,
      color: it?.color || '',
      talle: it?.talle || '',
    }));
    const order = { id, customer, items: normalizedItems, status: 'pendiente', ts: new Date().toISOString() };
    memory.orders.push(order);
    const uid = (customer || 'guest').toLowerCase();
    memory.loyaltyFlags[uid] = memory.loyaltyFlags[uid] || { profileCompleted: false, lastSpinDate: null, spinCredits: 0 };
    memory.loyaltyFlags[uid].spinCredits = (Number(memory.loyaltyFlags[uid].spinCredits) || 0) + 1;
    return res.json({ ok: true, id, stored: 'memory' });
  }
});

app.put('/api/admin/orders/:id/status', requireOrdersAccess, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};
  const allowed = new Set(['pendiente','preparando','listo','enviado','entregado','cancelado']);
  if (Number.isNaN(id) || !allowed.has(status)) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  }
  try {
    const curRes = await db.query('SELECT id, customer, customer_email, status FROM orders WHERE id = ? LIMIT 1', [id]);
    const curRow = Array.isArray(curRes.rows) ? curRes.rows[0] : null;
    if (!curRow) return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });
    const oldStatus = String(curRow.status || '').toLowerCase();
    const customer = String(curRow.customer || '').trim();
    const customerEmail = String(curRow.customer_email || '').trim().toLowerCase();
    const toEmail = isEmail(customerEmail) ? customerEmail : (isEmail(customer) ? customer : '');

    if (oldStatus === String(status).toLowerCase()) {
      return res.json({ ok: true, unchanged: true });
    }

    const r = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (r.affectedRows && r.affectedRows > 0) {
      if (toEmail) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        sendEmail({
          to: toEmail,
          subject: `Actualización de pedido #${id} - ${getOrderStatusLabel(status)}`,
          html: generateOrderStatusEmailHtml({ orderId: id, newStatus: status, oldStatus, frontendUrl }),
        }).catch(() => void 0);
      }
      return res.json({ ok: true });
    }
    throw new Error('No row updated');
  } catch (err) {
    const idx = memory.orders.findIndex(o => o.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });
    const oldStatus = String(memory.orders[idx].status || '').toLowerCase();
    if (oldStatus === String(status).toLowerCase()) {
      return res.json({ ok: true, unchanged: true, stored: 'memory' });
    }
    memory.orders[idx].status = status;
    const customer = String(memory.orders[idx].customer || '').trim();
    const customerEmail = String(memory.orders[idx].customerEmail || memory.orders[idx].customer_email || '').trim().toLowerCase();
    const toEmail = isEmail(customerEmail) ? customerEmail : (isEmail(customer) ? customer : '');
    if (toEmail) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      sendEmail({
        to: toEmail,
        subject: `Actualización de pedido #${id} - ${getOrderStatusLabel(status)}`,
        html: generateOrderStatusEmailHtml({ orderId: id, newStatus: status, oldStatus, frontendUrl }),
      }).catch(() => void 0);
    }
    return res.json({ ok: true, stored: 'memory' });
  }
});

// --- Admin: Proveedores ---
app.get('/api/admin/suppliers', requireSuppliersAccess, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, contact, email, phone, notes, created_at, updated_at FROM suppliers ORDER BY id DESC');
    const rows = Array.isArray(result.rows) ? result.rows : [];
    if (rows.length) return res.json(rows);
  } catch (err) {
    // ignorar y usar memoria
  }
  res.json(memory.suppliers);
});

app.post('/api/admin/suppliers', requireSuppliersAccess, async (req, res) => {
  const { name, contact, email, phone, notes } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'Nombre requerido' });
  try {
    const r = await db.query('INSERT INTO suppliers (name, contact, email, phone, notes) VALUES (?, ?, ?, ?, ?)', [name, contact || null, email || null, phone || null, notes || null]);
    const id = r.insertId;
    return res.json({ ok: true, id });
  } catch (err) {
    const id = (memory.suppliers.length ? memory.suppliers[memory.suppliers.length - 1].id + 1 : 1);
    const s = { id, name, contact: contact || '', email: email || '', phone: phone || '', notes: notes || '' };
    memory.suppliers.push(s);
    safePersistState();
    return res.json({ ok: true, id, stored: 'memory' });
  }
});

app.put('/api/admin/suppliers/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });
  const { name, contact, email, phone, notes } = req.body || {};
  try {
    const r = await db.query('UPDATE suppliers SET name = ?, contact = ?, email = ?, phone = ?, notes = ? WHERE id = ?', [name || null, contact || null, email || null, phone || null, notes || null, id]);
    if (r.affectedRows && r.affectedRows > 0) return res.json({ ok: true });
    throw new Error('No row updated');
  } catch (err) {
    const idx = memory.suppliers.findIndex(s => s.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Proveedor no encontrado' });
    const current = memory.suppliers[idx];
    memory.suppliers[idx] = {
      ...current,
      name: name ?? current.name,
      contact: contact ?? current.contact,
      email: email ?? current.email,
      phone: phone ?? current.phone,
      notes: notes ?? current.notes,
    };
    safePersistState();
    return res.json({ ok: true, stored: 'memory' });
  }
});

app.delete('/api/admin/suppliers/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });
  try {
    const r = await db.query('DELETE FROM suppliers WHERE id = ?', [id]);
    if (r.affectedRows && r.affectedRows > 0) return res.json({ ok: true });
    throw new Error('No row deleted');
  } catch (err) {
    const idx = memory.suppliers.findIndex(s => s.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Proveedor no encontrado' });
    memory.suppliers.splice(idx, 1);
    safePersistState();
    return res.json({ ok: true, stored: 'memory' });
  }
});

// --- Admin: Clientes (Usuarios) ---
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    // Intento 1: esquema completo (si existen las columnas)
    const result = await db.query('SELECT id, name, email, is_verified, role, created_at FROM users ORDER BY id DESC');
    const rows = Array.isArray(result.rows) ? result.rows : [];
    if (rows.length) return res.json(rows.map(r => ({
      id: r.id ?? r.email,
      name: r.name,
      email: r.email,
      is_verified: !!r.is_verified,
      role: r.role ?? 'client',
      created_at: r.created_at ?? null,
    })));
  } catch (err1) {
    try {
      // Intento 2: columnas mínimas seguras
      const result2 = await db.query('SELECT name, email, is_verified FROM users ORDER BY email DESC');
      const rows2 = Array.isArray(result2.rows) ? result2.rows : [];
      if (rows2.length) {
        return res.json(rows2.map(r => ({
          id: r.email,
          name: r.name,
          email: r.email,
          is_verified: !!r.is_verified,
          role: 'client',
          created_at: null,
        })));
      }
    } catch (err2) {
      // ignorar y usar memoria
    }
  }
  const users = Object.values(memory.users || {}).map(u => ({
    id: u.email,
    name: u.name,
    email: u.email,
    is_verified: !!u.is_verified,
    role: u.role || 'client',
    created_at: u.created_at || null,
  }));
  res.json(users);
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { name, email, password, is_verified, role } = req.body || {};
  if (!name || !email) return res.status(400).json({ ok: false, error: 'Nombre y email requeridos' });
  const normalizedRole = normalizePanelRole(role || 'client');
  try {
    const r = await db.query('INSERT INTO users (name, email, password, is_verified, role) VALUES (?, ?, ?, ?, ?)', [name, email.toLowerCase(), password || null, is_verified ? 1 : 0, normalizedRole || 'client']);
    return res.json({ ok: true, id: r.insertId });
  } catch (err) {
    const userId = email.toLowerCase();
    memory.users[userId] = { name, email: userId, password: password || null, is_verified: !!is_verified, role: normalizedRole || 'client' };
    safePersistState();
    return res.json({ ok: true, id: userId, stored: 'memory' });
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, email, password, is_verified, role } = req.body || {};
  try {
    // Si el ID es numérico, intentamos DB
    if (!isNaN(id)) {
      const r = await db.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), password = COALESCE(?, password), is_verified = COALESCE(?, is_verified), role = COALESCE(?, role) WHERE id = ?',
        [name || null, email ? email.toLowerCase() : null, password || null, is_verified != null ? (is_verified ? 1 : 0) : null, role || null, id]
      );
      if (r.affectedRows && r.affectedRows > 0) return res.json({ ok: true });
    }
    throw new Error('Fallback to memory');
  } catch (err) {
    const userId = id.toLowerCase();
    if (!memory.users[userId]) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    memory.users[userId] = {
      ...memory.users[userId],
      name: name ?? memory.users[userId].name,
      email: email ? email.toLowerCase() : memory.users[userId].email,
      password: password || memory.users[userId].password || null,
      is_verified: is_verified != null ? !!is_verified : memory.users[userId].is_verified,
      role: role ?? memory.users[userId].role,
    };
    safePersistState();
    return res.json({ ok: true, stored: 'memory' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    if (!isNaN(id)) {
      const r = await db.query('DELETE FROM users WHERE id = ?', [id]);
      if (r.affectedRows && r.affectedRows > 0) return res.json({ ok: true });
    }
    throw new Error('Fallback to memory');
  } catch (err) {
    const userId = id.toLowerCase();
    if (!memory.users[userId]) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    delete memory.users[userId];
    safePersistState();
    return res.json({ ok: true, stored: 'memory' });
  }
});

// --- Admin: Promociones ---
app.get('/api/admin/promotions', requirePromotionsAccess, async (req, res) => {
  const promos = await listAdminPromotions();
  res.json(promos);
});

app.post('/api/admin/promotions', requirePromotionsAccess, async (req, res) => {
  const {
    productId,
    title,
    description,
    imageBase64,
    price,
    sizes,
    stockPromocion,
    fechaInicio,
    fechaFin,
  } = req.body || {};
  const productIdNum = Number(productId);
  const promoPrice = Number(price);
  const promoStock = Number(stockPromocion);
  if (!Number.isInteger(productIdNum) || !Number.isFinite(promoPrice) || promoPrice < 0 || !Number.isInteger(promoStock) || promoStock < 15) {
    return res.status(400).json({ ok: false, error: 'Producto, precio promocional y stock promocional minimo de 15 son obligatorios' });
  }
  try {
    const productRes = await db.query('SELECT id, name, price, image, quantity FROM products WHERE id = ? LIMIT 1', [productIdNum]);
    const product = Array.isArray(productRes.rows) ? productRes.rows[0] : null;
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    if ((Number(product.quantity) || 0) < promoStock) {
      return res.status(400).json({
        ok: false,
        error: 'No hay stock general suficiente para reservar la promoción',
        available: Number(product.quantity) || 0,
        productId: Number(product.id) || productIdNum,
        productName: product.name || null,
      });
    }
    await db.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [promoStock, productIdNum]);
    const result = await db.query(
      `INSERT INTO promotions(title, description, image, price, sizes, product_id, promo_price, promo_stock, promo_stock_remaining, start_at, end_at, state)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activa')`,
      [
        title || product.name,
        description || '',
        imageBase64 || product.image,
        promoPrice,
        sizes || null,
        productIdNum,
        promoPrice,
        promoStock,
        promoStock,
        fechaInicio || null,
        fechaFin || null,
      ]
    );
    const id = result.insertId;
    if (!id) throw new Error('No id from DB');
    safePersistState();
    res.json({ ok: true, id });
  } catch (err) {
    if (DB_ENABLED) {
      return res.status(500).json({ ok: false, error: 'DB no disponible' });
    }
    const product = getMemoryProduct({ id: productIdNum });
    if (!product) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    if ((Number(product.quantity) || 0) < promoStock) {
      return res.status(400).json({
        ok: false,
        error: 'No hay stock general suficiente para reservar la promoción',
        available: Number(product.quantity) || 0,
        productId: productIdNum,
        productName: product.name || null,
      });
    }
    product.quantity = Math.max((Number(product.quantity) || 0) - promoStock, 0);
    const id = (memory.promotions.length ? memory.promotions[memory.promotions.length - 1].id + 1 : 1);
    memory.promotions.push({
      id,
      product_id: productIdNum,
      product_name: product.name,
      title: title || product.name,
      description: description || '',
      image: imageBase64 || product.image,
      sizes: sizes || '',
      precio_normal: Number(product.price) || 0,
      precio_promocion: promoPrice,
      stock_promocion: promoStock,
      stock_promocion_restante: promoStock,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      estado: 'activa',
    });
    safePersistState();
    res.json({ ok: true, id, stored: 'memory' });
  }
});

app.put('/api/admin/promotions/:id', requirePromotionsAccess, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, imageBase64, price, sizes, stockPromocion, fechaInicio, fechaFin, estado } = req.body || {};
  if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });
  try {
    const currentRes = await db.query('SELECT id, product_id, promo_stock, promo_stock_remaining, state FROM promotions WHERE id = ? LIMIT 1', [id]);
    const current = Array.isArray(currentRes.rows) ? currentRes.rows[0] : null;
    if (!current) return res.status(404).json({ ok: false, error: 'Promoción no encontrada' });
    const currentTotal = Number(current.promo_stock) || 0;
    const currentRemaining = Number(current.promo_stock_remaining) || 0;
    const soldQty = Math.max(currentTotal - currentRemaining, 0);
    const estadoLower = String(estado || '').trim().toLowerCase();

    if (estadoLower === 'agotada') {
      if (currentRemaining > 0 && current.product_id != null) {
        await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [currentRemaining, current.product_id]);
      }
      const result = await db.query(
        `UPDATE promotions
         SET promo_stock_remaining = 0,
             state = 'agotada'
         WHERE id = ?`,
        [id]
      );
      if (result.affectedRows && result.affectedRows > 0) {
        safePersistState();
        return res.json({ ok: true, id });
      }
      throw new Error('No DB row updated');
    }
    const requestedTotal = stockPromocion == null || stockPromocion === '' ? currentTotal : Number(stockPromocion);
    if (stockPromocion != null && stockPromocion !== '' && requestedTotal < 15) {
      return res.status(400).json({ ok: false, error: 'El stock promocional minimo es 15' });
    }
    if (!Number.isInteger(requestedTotal) || requestedTotal < soldQty) {
      return res.status(400).json({ ok: false, error: 'El stock promocional no puede ser menor al ya vendido' });
    }
    const diff = requestedTotal - currentTotal;
    if (diff !== 0) {
      if (diff > 0) {
        const productRes = await db.query('SELECT quantity FROM products WHERE id = ? LIMIT 1', [current.product_id]);
        const product = Array.isArray(productRes.rows) ? productRes.rows[0] : null;
        if (!product || (Number(product.quantity) || 0) < diff) {
          return res.status(400).json({ ok: false, error: 'No hay stock general suficiente para ampliar la promoción' });
        }
        await db.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [diff, current.product_id]);
      } else {
        await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [Math.abs(diff), current.product_id]);
      }
    }
    const result = await db.query(
      `UPDATE promotions
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           image = COALESCE(?, image),
           price = COALESCE(?, price),
           sizes = COALESCE(?, sizes),
           promo_price = COALESCE(?, promo_price),
           promo_stock = COALESCE(?, promo_stock),
           promo_stock_remaining = COALESCE(?, promo_stock_remaining),
           start_at = COALESCE(?, start_at),
           end_at = COALESCE(?, end_at),
           state = COALESCE(?, state)
       WHERE id = ?`,
      [
        title || null,
        description || null,
        imageBase64 || null,
        (price != null ? Number(price) : null),
        sizes || null,
        (price != null ? Number(price) : null),
        (stockPromocion != null && stockPromocion !== '' ? requestedTotal : null),
        (stockPromocion != null && stockPromocion !== '' ? Math.max(requestedTotal - soldQty, 0) : null),
        fechaInicio || null,
        fechaFin || null,
        estado || null,
        id,
      ]
    );
    if (result.affectedRows && result.affectedRows > 0) {
      safePersistState();
      return res.json({ ok: true, id });
    }
    throw new Error('No DB row updated');
  } catch (err) {
    const idx = memory.promotions.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Promoción no encontrada' });
    const current = memory.promotions[idx];
    const currentTotal = Number(current.stock_promocion) || 0;
    const currentRemaining = Number(current.stock_promocion_restante) || 0;
    const soldQty = Math.max(currentTotal - currentRemaining, 0);
    const estadoLower = String(estado || '').trim().toLowerCase();

    if (estadoLower === 'agotada') {
      const product = getMemoryProduct({ id: Number(current.product_id) || NaN });
      if (product && currentRemaining > 0) {
        product.quantity = (Number(product.quantity) || 0) + currentRemaining;
      }
      memory.promotions[idx] = {
        ...current,
        stock_promocion_restante: 0,
        estado: 'agotada',
      };
      safePersistState();
      return res.json({ ok: true, id, stored: 'memory' });
    }
    const requestedTotal = stockPromocion == null || stockPromocion === '' ? currentTotal : Number(stockPromocion);
    if (stockPromocion != null && stockPromocion !== '' && requestedTotal < 15) {
      return res.status(400).json({ ok: false, error: 'El stock promocional minimo es 15' });
    }
    if (!Number.isInteger(requestedTotal) || requestedTotal < soldQty) {
      return res.status(400).json({ ok: false, error: 'El stock promocional no puede ser menor al ya vendido' });
    }
    const diff = requestedTotal - currentTotal;
    const product = getMemoryProduct({ id: Number(current.product_id) || NaN });
    if (diff > 0 && (!product || (Number(product.quantity) || 0) < diff)) {
      return res.status(400).json({ ok: false, error: 'No hay stock general suficiente para ampliar la promoción' });
    }
    if (product && diff !== 0) {
      product.quantity = diff > 0
        ? Math.max((Number(product.quantity) || 0) - diff, 0)
        : (Number(product.quantity) || 0) + Math.abs(diff);
    }
    memory.promotions[idx] = {
      ...current,
      title: title ?? current.title,
      description: description ?? current.description,
      image: imageBase64 ?? current.image,
      precio_promocion: (price!=null? Number(price): current.precio_promocion),
      sizes: sizes ?? current.sizes,
      stock_promocion: requestedTotal,
      stock_promocion_restante: Math.max(requestedTotal - soldQty, 0),
      fecha_inicio: fechaInicio ?? current.fecha_inicio,
      fecha_fin: fechaFin ?? current.fecha_fin,
      estado: estado ?? normalizePromotionState(current),
    };
    safePersistState();
    return res.json({ ok: true, id, stored: 'memory' });
  }
});

app.delete('/api/admin/promotions/:id', requirePromotionsAccess, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });
  try {
    const currentRes = await db.query('SELECT id, product_id, promo_stock_remaining FROM promotions WHERE id = ? LIMIT 1', [id]);
    const current = Array.isArray(currentRes.rows) ? currentRes.rows[0] : null;
    if (current && Number(current.promo_stock_remaining) > 0) {
      await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [Number(current.promo_stock_remaining) || 0, current.product_id]);
    }
    await db.query('DELETE FROM promotions WHERE id = ?', [id]);
    safePersistState();
    return res.json({ ok: true });
  } catch (err) {
    const idx = memory.promotions.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'Promoción no encontrada' });
    const promo = memory.promotions[idx];
    const product = getMemoryProduct({ id: Number(promo.product_id) || NaN });
    if (product && Number(promo.stock_promocion_restante) > 0) {
      product.quantity = (Number(product.quantity) || 0) + (Number(promo.stock_promocion_restante) || 0);
    }
    memory.promotions.splice(idx, 1);
    safePersistState();
    return res.json({ ok: true, stored: 'memory' });
  }
});

// --- Admin: Settings ---
app.get('/api/admin/settings', requireProductsView, async (req, res) => {
  try {
    const r = await db.query('SELECT min_stock, admin_email, admin_password, admin_name, company_name, company_address, company_city, company_phone, company_email, company_cuit, company_logo FROM admin_settings WHERE id = 1');
    const row = (r.rows && r.rows[0]) || null;
    if (row) {
      return res.json({
        minStock: Number(row.min_stock) || memory.settings.minStock,
        adminEmail: row.admin_email || memory.settings.adminEmail,
        adminPassword: row.admin_password || memory.settings.adminPassword,
        adminName: row.admin_name || memory.settings.adminName,
        companyName: row.company_name || memory.settings.companyName,
        companyAddress: row.company_address || memory.settings.companyAddress,
        companyCity: row.company_city || memory.settings.companyCity,
        companyPhone: row.company_phone || memory.settings.companyPhone,
        companyEmail: row.company_email || memory.settings.companyEmail,
        companyCuit: row.company_cuit || memory.settings.companyCuit,
        companyLogo: row.company_logo || memory.settings.companyLogo,
      });
    }
  } catch (err) {
    // ignorar y usar memoria
  }
  res.json(memory.settings);
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  const { minStock, adminEmail, adminPassword, adminName, companyName, companyAddress, companyCity, companyPhone, companyEmail, companyCuit, companyLogo } = req.body || {};
  if (typeof minStock === 'number' && minStock >= 0) memory.settings.minStock = minStock;
  if (typeof adminEmail === 'string') memory.settings.adminEmail = (adminEmail || '').trim();
  if (typeof adminPassword === 'string') memory.settings.adminPassword = adminPassword;
  if (typeof adminName === 'string') {
    const nameVal = (adminName || '').trim();
    if (nameVal) memory.settings.adminName = nameVal;
  }
  if (typeof companyName === 'string') memory.settings.companyName = (companyName || '').trim();
  if (typeof companyAddress === 'string') memory.settings.companyAddress = (companyAddress || '').trim();
  if (typeof companyCity === 'string') memory.settings.companyCity = (companyCity || '').trim();
  if (typeof companyPhone === 'string') memory.settings.companyPhone = (companyPhone || '').trim();
  if (typeof companyEmail === 'string') memory.settings.companyEmail = (companyEmail || '').trim();
  if (typeof companyCuit === 'string') memory.settings.companyCuit = (companyCuit || '').trim();
  if (typeof companyLogo === 'string') memory.settings.companyLogo = companyLogo;
  try {
    await db.query(
      'INSERT INTO admin_settings (id, min_stock, admin_email, admin_password, admin_name, company_name, company_address, company_city, company_phone, company_email, company_cuit, company_logo) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE min_stock = VALUES(min_stock), admin_email = VALUES(admin_email), admin_password = VALUES(admin_password), admin_name = VALUES(admin_name), company_name = VALUES(company_name), company_address = VALUES(company_address), company_city = VALUES(company_city), company_phone = VALUES(company_phone), company_email = VALUES(company_email), company_cuit = VALUES(company_cuit), company_logo = VALUES(company_logo)',
      [
        memory.settings.minStock || 2,
        memory.settings.adminEmail || null,
        memory.settings.adminPassword || null,
        memory.settings.adminName || null,
        memory.settings.companyName || null,
        memory.settings.companyAddress || null,
        memory.settings.companyCity || null,
        memory.settings.companyPhone || null,
        memory.settings.companyEmail || null,
        memory.settings.companyCuit || null,
        memory.settings.companyLogo || null,
      ]
    );
  } catch (err) {
    // si falla, se mantiene en memoria
  }
  res.json({ ok: true, settings: memory.settings });
});

app.get('/api/site/brand', async (req, res) => {
  const homeFallback = memory.site?.home?.images?.[0] || null;
  const fallback = {
    companyName: memory.settings.companyName || 'JJ Indumentaria',
    companyLogo: memory.settings.companyLogo || null,
    homeLogo: homeFallback,
  };
  if (!DB_ENABLED) return res.json(fallback);
  try {
    const r = await db.query('SELECT company_name, company_logo FROM admin_settings WHERE id = 1');
    const row = (r.rows && r.rows[0]) || null;
    if (row) {
      return res.json({
        companyName: row.company_name || fallback.companyName,
        companyLogo: row.company_logo || fallback.companyLogo,
        homeLogo: fallback.homeLogo,
      });
    }
  } catch (err) {
    void 0;
  }
  res.json(fallback);
});

app.get('/api/admin/reports/products', requireAdmin, async (req, res) => {
  const q = req.query || {};
  const fromRaw = String(q.from || '').trim();
  const toRaw = String(q.to || '').trim();
  const thresholdRaw = q.threshold;
  const threshold = Math.max(0, Number(thresholdRaw) || (memory.settings.minStock || 2));

  const parseDate = (s) => {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const fromDate = fromRaw ? parseDate(fromRaw) : null;
  const toDate = toRaw ? parseDate(toRaw) : null;

  const formatSqlDateTime = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const company = {
    companyName: memory.settings.companyName || '',
    companyAddress: memory.settings.companyAddress || '',
    companyCity: memory.settings.companyCity || '',
    companyPhone: memory.settings.companyPhone || '',
    companyEmail: memory.settings.companyEmail || '',
    companyCuit: memory.settings.companyCuit || '',
    companyLogo: memory.settings.companyLogo || null,
  };

  if (!DB_ENABLED) {
    const products = Array.isArray(memory.products) ? memory.products : [];
    const sold = products
      .map(p => ({ id: p.id, name: p.name, sold: Number(p.soldCount) || 0, revenue: (Number(p.soldCount) || 0) * (Number(p.price) || 0) }))
      .filter(r => r.sold > 0)
      .sort((a, b) => b.sold - a.sold);
    const faltantes = products
      .map(p => ({ id: p.id, name: p.name, quantity: Number(p.quantity) || 0, price: Number(p.price) || 0, category: p.category || '' }))
      .filter(p => p.quantity <= threshold)
      .sort((a, b) => a.quantity - b.quantity);
    return res.json({ ok: true, company, threshold, from: fromRaw || null, to: toRaw || null, sold, faltantes });
  }

  try {
    const where = [];
    const params = [];
    if (fromDate) { where.push('o.created_at >= ?'); params.push(formatSqlDateTime(fromDate)); }
    if (toDate) { where.push('o.created_at <= ?'); params.push(formatSqlDateTime(toDate)); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const soldRes = await db.query(
      `
      SELECT 
        COALESCE(oi.product_id, 0) AS product_id,
        oi.name AS name,
        SUM(oi.qty) AS sold,
        SUM(oi.qty * oi.price) AS revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      ${whereSql}
      GROUP BY oi.product_id, oi.name
      ORDER BY sold DESC
      `,
      params
    );

    const sold = (Array.isArray(soldRes.rows) ? soldRes.rows : []).map(r => ({
      id: Number(r.product_id) || null,
      name: r.name,
      sold: Number(r.sold) || 0,
      revenue: Number(r.revenue) || 0,
    })).filter(r => r.sold > 0);

    const faltantesRes = await db.query(
      'SELECT id, name, price, category, quantity FROM products WHERE quantity <= ? ORDER BY quantity ASC, id ASC',
      [threshold]
    );
    const faltantes = (Array.isArray(faltantesRes.rows) ? faltantesRes.rows : []).map(r => ({
      id: Number(r.id) || r.id,
      name: r.name,
      price: Number(r.price) || 0,
      category: r.category || '',
      quantity: Number(r.quantity) || 0,
    }));

    const s = await db.query('SELECT company_name, company_address, company_city, company_phone, company_email, company_cuit, company_logo FROM admin_settings WHERE id = 1');
    const row = (s.rows && s.rows[0]) || null;
    if (row) {
      company.companyName = row.company_name || company.companyName;
      company.companyAddress = row.company_address || company.companyAddress;
      company.companyCity = row.company_city || company.companyCity;
      company.companyPhone = row.company_phone || company.companyPhone;
      company.companyEmail = row.company_email || company.companyEmail;
      company.companyCuit = row.company_cuit || company.companyCuit;
      company.companyLogo = row.company_logo || company.companyLogo;
    }

    res.json({ ok: true, company, threshold, from: fromRaw || null, to: toRaw || null, sold, faltantes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Endpoint admin para disparar migración memoria->DB manualmente
async function auditAdmin(action, detail, req) {
  try {
    const auth = req?.headers?.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const sess = token ? memory.admin.sessions.get(token) : null;
    const adminEmail = (sess && sess.email) || (process.env.ADMIN_EMAIL || null);
    const adminName = (sess && sess.name) || (memory.settings.adminName || null);
    await db.query(
      'INSERT INTO admin_audit_logs(action, detail_json, admin_email, admin_name) VALUES(?, ?, ?, ?)',
      [action, JSON.stringify(detail || {}), adminEmail, adminName]
    );
  } catch (err) {
    // Si falla la DB, registrar en consola para no romper flujo
    console.log('AUDIT', action, detail || {});
  }
}

if ((process.env.ENABLE_ADMIN_MIGRATE || 'true').toLowerCase() !== 'false') {
  app.post('/api/admin/migrate/memory-to-db', requireAdmin, async (req, res) => {
    try {
      await auditAdmin('migrate_memory_to_db_start', { source: 'manual_endpoint' }, req);
      await migrateMemoryToDb();
      await auditAdmin('migrate_memory_to_db_done', { result: 'ok' }, req);
      res.json({ ok: true, migrated: true });
    } catch (err) {
      await auditAdmin('migrate_memory_to_db_error', { error: err?.message || String(err) }, req);
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });
}

// Listar auditorías admin recientes
app.get('/api/admin/audit/logs', requireAdmin, async (req, res) => {
  try {
    const q = req.query || {};
    const limitRaw = q.limit;
    const limit = Math.max(1, Math.min(200, Number(limitRaw) || 50));
    const action = (q.action || '').trim();
    const adminEmail = (q.adminEmail || q.admin_email || '').trim();
    const adminName = (q.adminName || q.admin_name || '').trim();
    const fromRaw = (q.from || '').trim();
    const toRaw = (q.to || '').trim();

    const toSqlDateTime = (d) => {
      // Formats JS Date to 'YYYY-MM-DD HH:MM:SS' for MySQL DATETIME
      const pad = (n) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hour = pad(d.getHours());
      const min = pad(d.getMinutes());
      const sec = pad(d.getSeconds());
      return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
    };

    let sql = 'SELECT id, action, detail_json, admin_email, admin_name, created_at FROM admin_audit_logs';
    const params = [];
    const conditions = [];

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (adminEmail) {
      conditions.push('admin_email = ?');
      params.push(adminEmail);
    }
    if (adminName) {
      conditions.push('admin_name = ?');
      params.push(adminName);
    }
    if (fromRaw) {
      const d = new Date(fromRaw);
      if (!isNaN(d.getTime())) {
        conditions.push('created_at >= ?');
        params.push(toSqlDateTime(d));
      }
    }
    if (toRaw) {
      const d = new Date(toRaw);
      if (!isNaN(d.getTime())) {
        conditions.push('created_at <= ?');
        params.push(toSqlDateTime(d));
      }
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY id DESC LIMIT ' + limit;

    const r = await db.query(sql, params);
    const rows = Array.isArray(r.rows) ? r.rows : [];
    const logs = rows.map(row => ({
      id: row.id,
      action: row.action,
      detail: (() => { try { return JSON.parse(row.detail_json || '{}'); } catch { return {}; } })(),
      adminEmail: row.admin_email || null,
      adminName: row.admin_name || null,
      createdAt: row.created_at,
    }));
    res.json({ ok: true, logs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Endpoint de prueba (solo admin) para sembrar datos en memoria y verificar migración
if (process.env.NODE_ENV === 'development') {
  app.post('/api/admin/dev/seed-memory', requireAdmin, (req, res) => {
    // Sembrar un proveedor en memoria
    const nextSupId = (memory.suppliers.length ? memory.suppliers[memory.suppliers.length - 1].id + 1 : 1);
    memory.suppliers.push({ id: nextSupId, name: 'Proveedor Memoria', contact: 'Contacto', email: 'mem@example.com', phone: '000', notes: 'Semilla' });

    // Sembrar un pedido en memoria con un item
    const nextOrdId = (memory.orders.length ? memory.orders[memory.orders.length - 1].id + 1 : 1);
    memory.orders.push({ id: nextOrdId, customer: 'Cliente Memoria', items: [{ id: null, name: 'Item Memoria', qty: 1, price: 1000 }], status: 'pendiente' });

    res.json({ ok: true, suppliers: memory.suppliers.length, orders: memory.orders.length });
  });
}

// --- Site: Home (público)
app.get('/api/site/home', async (req, res) => {
  const legacyImages = ['/img/ima1.webp', '/img/ima2.webp', '/img/ima3.webp'];
  const legacyCaptions = ['Nueva temporada', 'Ofertas imperdibles', 'Calidad y estilo'];
  const nextImages = ['/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg', '/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg', '/img/top-view-accessoires-travel-with-man-clothing-concept-shirt.jpg'];
  const nextCaptions = ['Nueva Temporada 2024', 'Esencia Masculina', 'Estilo sin Límites'];
  const normalizeHome = (home) => {
    const images = Array.isArray(home?.images) ? home.images : [];
    const captions = Array.isArray(home?.captions) ? home.captions : [];
    const usesLegacyImages = images.length === legacyImages.length && images.every((img, i) => img === legacyImages[i]);
    const usesLegacyCaptions = captions.length === legacyCaptions.length && captions.every((txt, i) => txt === legacyCaptions[i]);
    return {
      images: usesLegacyImages ? nextImages : images,
      captions: usesLegacyCaptions ? nextCaptions : captions,
      intervalMs: Number(home?.intervalMs) || 3000,
      pauseOnHover: !!home?.pauseOnHover,
    };
  };
  try {
    const result = await db.query('SELECT images_json, captions_json, interval_ms, pause_on_hover FROM site_home WHERE id = 1');
    const row = (result.rows && result.rows[0]) || null;
    if (row) {
      const images = (() => { try { return JSON.parse(row.images_json || '[]'); } catch { return []; } })();
      const captions = (() => { try { return JSON.parse(row.captions_json || '[]'); } catch { return []; } })();
      const intervalMs = Number(row.interval_ms) || 3000;
      const pauseOnHover = !!row.pause_on_hover;
      return res.json(normalizeHome({ images, captions, intervalMs, pauseOnHover }));
    }
  } catch (err) {
    // Ignorar y usar memoria como fallback
  }
  const home = memory.site?.home || { images: [], captions: [], intervalMs: 3000, pauseOnHover: true };
  res.json(normalizeHome(home));
});

// --- Admin: Site Home (editar)
app.put('/api/admin/site/home', requireAdmin, async (req, res) => {
  const { images, captions, intervalMs, pauseOnHover } = req.body || {};
  const target = memory.site.home;
  if (Array.isArray(images) && images.length > 0) {
    target.images = images.map(String).slice(0, 10);
  }
  if (Array.isArray(captions) && captions.length > 0) {
    target.captions = captions.map(c => String(c).slice(0, 200)).slice(0, 10);
  }
  if (typeof intervalMs === 'number' && intervalMs >= 1000 && intervalMs <= 60000) {
    target.intervalMs = Math.floor(intervalMs);
  }
  if (typeof pauseOnHover === 'boolean') {
    target.pauseOnHover = pauseOnHover;
  }
  // Intentar persistir en DB; si no hay pool configurado, el helper devuelve rows vacías y no falla
  try {
    const imagesJson = JSON.stringify(target.images || []);
    const captionsJson = JSON.stringify(target.captions || []);
    await db.query(
      'INSERT INTO site_home (id, images_json, captions_json, interval_ms, pause_on_hover) VALUES (1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE images_json = VALUES(images_json), captions_json = VALUES(captions_json), interval_ms = VALUES(interval_ms), pause_on_hover = VALUES(pause_on_hover)',
      [imagesJson, captionsJson, target.intervalMs || 3000, target.pauseOnHover ? 1 : 0]
    );
  } catch (err) {
    // Si falla DB, igual respondemos con memoria y dejamos constancia opcional
    // console.error('Persistencia site_home falló:', err);
  }
  res.json({ ok: true, home: target });
});

// --- Admin: Mensajes de contacto ---
app.get('/api/admin/contact-messages', requireSalesAccess, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, message, status, reply, replied_by_email, replied_by_name, replied_at, created_at FROM contact_messages ORDER BY id DESC LIMIT 200'
    );
    const rows = Array.isArray(result.rows) ? result.rows : [];
    return res.json(rows);
  } catch (err) {
    try {
      const legacy = await db.query('SELECT id, name, email, message FROM contact_messages ORDER BY id DESC LIMIT 200');
      const rows = Array.isArray(legacy.rows) ? legacy.rows : [];
      return res.json(rows.map(row => ({ ...row, status: 'pendiente', reply: null, replied_at: null })));
    } catch {
      return res.json([]);
    }
  }
});

app.put('/api/admin/contact-messages/:id/reply', requireSalesAccess, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'ID inválido' });

  const reply = String(req.body?.reply || '').trim();
  if (!reply) return res.status(400).json({ ok: false, error: 'La respuesta no puede estar vacía' });

  const panel = req.panelSession || {};
  const repliedByEmail = String(panel.email || '').trim().toLowerCase() || null;
  const repliedByName = String(panel.name || '').trim() || null;
  const escHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  try {
    const msgResult = await db.query('SELECT id, name, email, message FROM contact_messages WHERE id = ? LIMIT 1', [id]);
    const msg = Array.isArray(msgResult.rows) ? msgResult.rows[0] : null;
    if (!msg) return res.status(404).json({ ok: false, error: 'Mensaje no encontrado' });

    await db.query(
      "UPDATE contact_messages SET reply = ?, status = 'respondida', replied_by_email = ?, replied_by_name = ?, replied_at = NOW() WHERE id = ?",
      [reply, repliedByEmail, repliedByName, id]
    );

    const mailOk = await sendEmail({
      to: msg.email,
      subject: 'Respuesta a tu consulta',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.4;">
          <p>Hola ${String(msg.name || '').trim() || 'cliente'},</p>
          <p>Respondimos tu consulta:</p>
          <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; white-space: pre-wrap;">${escHtml(reply)}</div>
          <p style="margin-top: 16px;">Gracias por comunicarte con nosotros.</p>
        </div>
      `,
    });

    return res.json({
      ok: true,
      mailed: !!mailOk,
      message: {
        id,
        reply,
        status: 'respondida',
        replied_by_email: repliedByEmail,
        replied_by_name: repliedByName,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'No se pudo guardar la respuesta' });
  }
});

// --- Admin: Reportes ---
app.get('/api/admin/reports/summary', requireAdmin, (req, res) => {
  const products = memory.products || [];
  const sales = memory.sales || [];
  const byProduct = products.map(p => ({ id: p.id, name: p.name, sold: p.soldCount || 0, revenue: (p.soldCount || 0) * (p.price || 0) }));
  const totalRevenue = byProduct.reduce((acc, r) => acc + r.revenue, 0);
  res.json({ byProduct, totalRevenue, salesCount: sales.length });
});

// --- User: Perfil ---
app.get('/api/user/me', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const base = memory.users[userId] || { name: 'Invitado', email: userId, is_verified: false };

  let name = base.name || 'Usuario';
  let email = base.email || userId;
  let is_verified = !!base.is_verified;
  let phone = base.phone || '';
  let addresses = Array.isArray(base.addresses) ? base.addresses : [];
  let avatar = base.avatar || null;

  if (DB_ENABLED && userId !== 'guest') {
    try {
      const uRes = await db.query('SELECT name, email, is_verified FROM users WHERE email = ? LIMIT 1', [userId]);
      const uRow = Array.isArray(uRes.rows) ? uRes.rows[0] : null;
      if (uRow) {
        name = uRow.name || name;
        email = uRow.email || email;
        is_verified = !!uRow.is_verified;
      }
      const pRes = await db.query('SELECT phone, addresses_json, avatar FROM user_profiles WHERE user_email = ? LIMIT 1', [userId]);
      const pRow = Array.isArray(pRes.rows) ? pRes.rows[0] : null;
      if (pRow) {
        phone = pRow.phone || phone;
        try {
          const parsed = JSON.parse(pRow.addresses_json || '[]');
          if (Array.isArray(parsed)) addresses = parsed;
        } catch (err) {
          void 0;
        }
        avatar = pRow.avatar || avatar;
      }
    } catch (err) {
      void 0;
    }
  }

  const profile = { name, email, phone, addresses, avatar, is_verified };
  memory.users[userId] = { ...(memory.users[userId] || {}), ...profile };
  res.json(profile);
});

// Enviar o reenviar código de verificación
app.post('/api/auth/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'Email requerido' });
  const emailNorm = String(email).trim().toLowerCase();

  if (DB_ENABLED) {
    try {
      const u = await db.query('SELECT is_verified FROM users WHERE email = ? LIMIT 1', [emailNorm]);
      const row = (u.rows && u.rows[0]) || null;
      if (row && Number(row.is_verified) === 1) {
        return res.json({ ok: true, message: 'Email ya verificado' });
      }
    } catch (err) {
      void 0;
    }
  } else {
    const u = memory.users[emailNorm];
    if (u && u.is_verified) return res.json({ ok: true, message: 'Email ya verificado' });
  }

  const code = generateVerificationCode();
  if (DB_ENABLED) {
    try {
      await db.query(
        'INSERT INTO email_verification_tokens (email, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
        [emailNorm, sha256Hex(code)]
      );
    } catch (err) {
      void 0;
    }
  }
  if (!memory.auth) memory.auth = {};
  if (!memory.auth.verificationCodes) memory.auth.verificationCodes = {};
  memory.auth.verificationCodes[emailNorm] = { code, exp: Date.now() + 30 * 60 * 1000 };
  
  const mailOk = await sendEmailFast({
    to: emailNorm,
    subject: 'Código de verificación - JJ Indumentaria',
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1E3A8A; text-align: center;">Verifica tu correo</h2>
        <p>¡Hola! Para continuar en <strong>JJ Indumentaria</strong>, utiliza el siguiente código:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1E3A8A; padding: 20px; background: #f0f4ff; border-radius: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #666;">Este código vence en 30 minutos.</p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">Si no solicitaste este código, puedes ignorar este correo.</p>
      </div>
    `,
  });

  res.json({
    ok: true,
    message: mailOk ? 'Código enviado correctamente.' : 'No se pudo enviar el email. Usá el código para verificar.',
    ...(mailOk ? {} : { devCode: code }),
  });
});

// Verificar código
app.post('/api/auth/verify-email', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ ok: false, error: 'Email y código requeridos' });

  const userId = String(email).trim().toLowerCase();
  const codeTrim = String(code).trim();

  if (DB_ENABLED) {
    try {
      const tokenHash = sha256Hex(codeTrim);
      const t = await db.query(
        'SELECT id FROM email_verification_tokens WHERE email = ? AND token_hash = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
        [userId, tokenHash]
      );
      const row = (t.rows && t.rows[0]) || null;
      if (!row) return res.status(400).json({ ok: false, error: 'Código inválido o vencido' });

      await db.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [row.id]);
      const updateResult = await db.query('UPDATE users SET is_verified = 1 WHERE email = ?', [userId]);
      if (updateResult && updateResult.affectedRows === 0) {
        await db.query(
          'INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE is_verified = 1',
          [userId.split('@')[0], userId, null]
        );
      }

      memory.users[userId] = memory.users[userId] || { name: userId, email: userId };
      memory.users[userId].is_verified = true;
      safePersistState();
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS referral_pending (
            referred_email VARCHAR(255) NOT NULL,
            referrer_email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (referred_email),
            KEY idx_referrer_email (referrer_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
        );
        await db.query(
          `CREATE TABLE IF NOT EXISTS referrals (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            referred_email VARCHAR(255) NOT NULL,
            referrer_email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_referred_email (referred_email),
            KEY idx_referrer_email (referrer_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
        );
        const pendingRes = await db.query(
          'SELECT referrer_email FROM referral_pending WHERE referred_email = ? LIMIT 1',
          [userId]
        );
        const pendingRow = Array.isArray(pendingRes.rows) ? pendingRes.rows[0] : null;
        const referrerEmail = pendingRow?.referrer_email ? String(pendingRow.referrer_email).trim().toLowerCase() : '';
        if (referrerEmail && referrerEmail !== userId && isEmail(referrerEmail)) {
          const ins = await db.query(
            'INSERT IGNORE INTO referrals (referred_email, referrer_email) VALUES (?, ?)',
            [userId, referrerEmail]
          );
          const inserted = Number(ins?.affectedRows) > 0;
          if (inserted) {
            await db.query(
              `CREATE TABLE IF NOT EXISTS user_loyalty (
                user_email VARCHAR(255) NOT NULL,
                referral_points INT NOT NULL DEFAULT 0,
                profile_points INT NOT NULL DEFAULT 0,
                review_points INT NOT NULL DEFAULT 0,
                social_points INT NOT NULL DEFAULT 0,
                spin_credits INT NOT NULL DEFAULT 0,
                profile_completed TINYINT(1) NOT NULL DEFAULT 0,
                last_spin_date DATE NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (user_email)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
            );
            await db.query(
              'INSERT INTO user_loyalty (user_email, referral_points) VALUES (?, 50) ON DUPLICATE KEY UPDATE referral_points = referral_points + 50',
              [referrerEmail]
            );
            memory.notifications[referrerEmail] = memory.notifications[referrerEmail] || [];
            memory.notifications[referrerEmail].push({ id: Date.now(), message: '🎁 ¡Ganaste 50 puntos JJ por un referido verificado!', ts: new Date().toISOString(), read: false });
          }
        }
        await db.query('DELETE FROM referral_pending WHERE referred_email = ?', [userId]);
      } catch (_) {
        void 0;
      }
      return res.json({ ok: true, userId, message: 'Verificado correctamente' });
    } catch (err) {
      void 0;
    }
  }

  const mem = memory.auth?.verificationCodes?.[userId] || null;
  if (!mem) return res.status(400).json({ ok: false, error: 'Código inválido o vencido. Reenviá el código e intentá de nuevo.' });
  if (Date.now() > Number(mem.exp || 0)) return res.status(400).json({ ok: false, error: 'Código inválido o vencido' });
  if (String(mem.code) !== codeTrim) return res.status(400).json({ ok: false, error: 'Código inválido' });

  memory.users[userId] = memory.users[userId] || { name: userId, email: userId };
  memory.users[userId].is_verified = true;
  safePersistState();
  try {
    const referrerEmail = String(memory.auth?.referralPending?.[userId] || '').trim().toLowerCase();
    if (referrerEmail && referrerEmail !== userId && isEmail(referrerEmail)) {
      memory.loyalty[userId] = memory.loyalty[userId] || {};
      memory.loyalty[referrerEmail] = memory.loyalty[referrerEmail] || { breakdown: { purchases: 0, referral: 0, profile: 0, review: 0, social: 0 } };
      memory.loyalty[referrerEmail].breakdown = memory.loyalty[referrerEmail].breakdown || { purchases: 0, referral: 0, profile: 0, review: 0, social: 0 };
      memory.loyalty[referrerEmail].breakdown.referral = Number(memory.loyalty[referrerEmail].breakdown.referral || 0) + 50;
      memory.notifications[referrerEmail] = memory.notifications[referrerEmail] || [];
      memory.notifications[referrerEmail].push({ id: Date.now(), message: '🎁 ¡Ganaste 50 puntos JJ por un referido verificado!', ts: new Date().toISOString(), read: false });
      if (memory.auth?.referralPending) delete memory.auth.referralPending[userId];
      safePersistState();
    }
  } catch (_) {
    void 0;
  }
  return res.json({ ok: true, userId, message: 'Verificado correctamente' });
});

app.put('/api/user/me', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const { name, phone, addresses, avatar } = req.body || {};
  memory.users[userId] = memory.users[userId] || { name: name || userId, email: userId };
  const current = memory.users[userId];
  memory.users[userId] = {
    ...current,
    name: typeof name === 'string' ? name : current.name,
    phone: typeof phone === 'string' ? phone : current.phone,
    addresses: Array.isArray(addresses) ? addresses : (current.addresses || []),
    avatar: typeof avatar === 'string' ? avatar : current.avatar || null,
  };
  if (DB_ENABLED && userId !== 'guest') {
    try {
      const nameNorm = typeof name === 'string' && name.trim() ? name.trim() : (current.name || userId.split('@')[0] || userId);
      await db.query(
        'INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, NULL, 0) ON DUPLICATE KEY UPDATE name = VALUES(name)',
        [nameNorm, userId]
      );
      await db.query(
        'INSERT INTO user_profiles (user_email, phone, addresses_json, avatar) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone), addresses_json = VALUES(addresses_json), avatar = VALUES(avatar)',
        [
          userId,
          typeof phone === 'string' ? phone : null,
          JSON.stringify(Array.isArray(addresses) ? addresses : (current.addresses || [])),
          typeof avatar === 'string' ? avatar : null,
        ]
      );
    } catch (err) {
      void 0;
    }
  }
  res.json({ ok: true });
});

// --- User: Pedidos ---
app.get('/api/user/orders', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  if (DB_ENABLED && userId !== 'guest') {
    try {
      const ordersRes = await db.query(
        'SELECT id, customer, customer_email, customer_name, customer_lastname, status, total, payment_method, shipping_recipient, shipping_address, shipping_province, shipping_postal_code, shipping_phone, shipping_carrier, shipping_tracking, created_at, updated_at FROM orders WHERE LOWER(customer) = ? OR LOWER(customer_email) = ? ORDER BY id DESC',
        [userId, userId]
      );
      const ordersRows = Array.isArray(ordersRes.rows) ? ordersRes.rows : [];
      if (ordersRows.length) {
        const ids = ordersRows.map(o => o.id);
        const placeholders = ids.map(() => '?').join(',');
        const itemsRes = await db.query(
          `SELECT id, order_id, product_id, name, qty, price, color, talle FROM order_items WHERE order_id IN (${placeholders})`,
          ids
        );
        const items = Array.isArray(itemsRes.rows) ? itemsRes.rows : [];
        const grouped = ordersRows.map(o => ({
          id: o.id,
          customer: o.customer,
          customerEmail: o.customer_email || (isEmail(o.customer) ? o.customer : ''),
          customerName: o.customer_name || '',
          customerLastName: o.customer_lastname || '',
          status: o.status,
          total: typeof o.total === 'number' ? o.total : Number(o.total) || 0,
          paymentMethod: o.payment_method || null,
          ts: (o.created_at || o.updated_at) ? new Date(o.created_at || o.updated_at).toISOString() : new Date().toISOString(),
          created_at: o.created_at,
          updated_at: o.updated_at,
          shipping: {
            recipient: o.shipping_recipient || '',
            address: o.shipping_address || '',
            province: o.shipping_province || '',
            postalCode: o.shipping_postal_code || '',
            phone: o.shipping_phone || '',
            carrier: o.shipping_carrier || '',
            tracking: o.shipping_tracking || '',
          },
          items: items.filter(it => it.order_id === o.id),
        }));
        return res.json(grouped);
      }
      return res.json([]);
    } catch (err) {
      void 0;
    }
  }
  const orders = (memory.orders || []).filter(o => (o.customer || '').toLowerCase() === userId);
  return res.json(orders);
});

// --- User: Favoritos ---
app.get('/api/user/favorites', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const favIds = memory.favorites[userId] || [];
  const products = (memory.products || []).filter(p => favIds.includes(p.id));
  res.json(products);
});

app.post('/api/user/favorites', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const { productId } = req.body || {};
  const pid = parseInt(productId, 10);
  if (Number.isNaN(pid)) return res.status(400).json({ ok: false, error: 'productId inválido' });
  memory.favorites[userId] = memory.favorites[userId] || [];
  if (!memory.favorites[userId].includes(pid)) memory.favorites[userId].push(pid);
  res.json({ ok: true });
});

app.delete('/api/user/favorites/:productId', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const pid = parseInt(req.params.productId, 10);
  if (Number.isNaN(pid)) return res.status(400).json({ ok: false, error: 'productId inválido' });
  const list = memory.favorites[userId] || [];
  memory.favorites[userId] = list.filter(id => id !== pid);
  res.json({ ok: true });
});

// --- User: Actividad ---
app.get('/api/user/activity', async (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  if (DB_ENABLED && userId !== 'guest') {
    try {
      const ordersRes = await db.query(
        'SELECT id, created_at, total FROM orders WHERE LOWER(customer) = ? OR LOWER(customer_email) = ? ORDER BY id DESC',
        [userId, userId]
      );
      const ordersRows = Array.isArray(ordersRes.rows) ? ordersRes.rows : [];
      if (!ordersRows.length) return res.json({ totalSpent: 0, byMonth: [], mostBought: [] });
      const ids = ordersRows.map(o => o.id);
      const placeholders = ids.map(() => '?').join(',');
      const itemsRes = await db.query(
        `SELECT order_id, name, qty, price FROM order_items WHERE order_id IN (${placeholders})`,
        ids
      );
      const items = Array.isArray(itemsRes.rows) ? itemsRes.rows : [];
      const byMonth = {};
      const productsCount = {};
      let totalSpent = 0;
      for (const o of ordersRows) {
        const month = (o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString()).slice(0, 7);
        byMonth[month] = byMonth[month] || { month, orders: 0, amount: 0 };
        byMonth[month].orders += 1;
        const orderItems = items.filter(it => it.order_id === o.id);
        const itemsAmount = orderItems.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
        const amt = (Number(o.total) || 0) > 0 ? (Number(o.total) || 0) : itemsAmount;
        byMonth[month].amount += amt;
        totalSpent += amt;
        for (const it of orderItems) {
          const key = it.name || `Producto ${it.product_id || ''}`.trim();
          productsCount[key] = (productsCount[key] || 0) + (Number(it.qty) || 0);
        }
      }
      const mostBought = Object.entries(productsCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
      return res.json({ totalSpent, byMonth: Object.values(byMonth), mostBought });
    } catch (err) {
      void 0;
    }
  }
  const orders = (memory.orders || []).filter(o => (o.customer || '').toLowerCase() === userId);
  const byMonth = {};
  const productsCount = {};
  let totalSpent = 0;
  orders.forEach(o => {
    const month = (o.ts || new Date().toISOString()).slice(0,7);
    byMonth[month] = byMonth[month] || { month, orders: 0, amount: 0 };
    byMonth[month].orders += 1;
    const amt = (o.items || []).reduce((acc, it) => acc + ((it.price || 0) * (it.qty || it.quantity || 1)), 0);
    byMonth[month].amount += amt;
    totalSpent += amt;
    (o.items || []).forEach(it => {
      const key = it.name || `Producto ${it.id}`;
      productsCount[key] = (productsCount[key] || 0) + (it.qty || it.quantity || 1);
    });
  });
  const mostBought = Object.entries(productsCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name, count])=>({ name, count }));
  return res.json({ totalSpent, byMonth: Object.values(byMonth), mostBought });
});

// --- User: Notificaciones ---
app.get('/api/user/notifications', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  res.json(memory.notifications[userId] || []);
});

app.post('/api/user/notifications', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: 'Mensaje requerido' });
  memory.notifications[userId] = memory.notifications[userId] || [];
  memory.notifications[userId].push({ id: Date.now(), message, ts: new Date().toISOString(), read: false });
  res.json({ ok: true });
});

// --- User: Fidelidad ---
// Estructura extendida: loyalty[userId] = {
//   points, tier, purchasesCount, breakdown: { purchases, referral, profile, review, social },
//   progress: { percent, current, nextThreshold, nextTier }, phrase
// }
app.get('/api/user/loyalty', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  if (DB_ENABLED && userId !== 'guest') {
    (async () => {
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS user_loyalty (
            user_email VARCHAR(255) NOT NULL,
            referral_points INT NOT NULL DEFAULT 0,
            profile_points INT NOT NULL DEFAULT 0,
            review_points INT NOT NULL DEFAULT 0,
            social_points INT NOT NULL DEFAULT 0,
            spin_credits INT NOT NULL DEFAULT 0,
            profile_completed TINYINT(1) NOT NULL DEFAULT 0,
            last_spin_date DATE NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
        );

        const statsRes = await db.query(
          `SELECT
             COUNT(DISTINCT o.id) AS orders_count,
             COALESCE(SUM(COALESCE(NULLIF(o.total, 0),
               (SELECT COALESCE(SUM(oi.qty * oi.price), 0) FROM order_items oi WHERE oi.order_id = o.id)
             )), 0) AS amount
           FROM orders o
           WHERE LOWER(o.customer) = ? OR LOWER(o.customer_email) = ?`,
          [userId, userId]
        );
        const statsRow = Array.isArray(statsRes.rows) ? statsRes.rows[0] : null;
        const purchasesCount = Number(statsRow?.orders_count) || 0;
        const amount = Number(statsRow?.amount) || 0;
        const purchasesPoints = Math.floor(amount / 1000);

        const extrasRes = await db.query(
          'SELECT referral_points, profile_points, review_points, social_points, spin_credits, profile_completed, last_spin_date FROM user_loyalty WHERE user_email = ? LIMIT 1',
          [userId]
        );
        const extrasRow = Array.isArray(extrasRes.rows) ? extrasRes.rows[0] : null;
        const breakdown = {
          purchases: purchasesPoints,
          referral: Number(extrasRow?.referral_points) || 0,
          profile: Number(extrasRow?.profile_points) || 0,
          review: Number(extrasRow?.review_points) || 0,
          social: Number(extrasRow?.social_points) || 0,
        };

        let tier = 'Bronze';
        if (purchasesCount >= 7) tier = 'Gold';
        else if (purchasesCount >= 3) tier = 'Silver';
        const nextTier = tier === 'Gold' ? null : (tier === 'Silver' ? 'Gold' : 'Silver');
        const nextThreshold = tier === 'Gold' ? null : (tier === 'Silver' ? 7 : 3);
        const currentForProgress = purchasesCount;
        const percent = nextThreshold ? Math.min(100, Math.round((currentForProgress / nextThreshold) * 100)) : 100;

        const totalPoints = breakdown.purchases + breakdown.referral + breakdown.profile + breakdown.review + breakdown.social;
        const phrase = 'Tu estilo vale más de lo que pensás. Cada compra te acerca a nuevos beneficios.';
        const spinCredits = Number(extrasRow?.spin_credits) || 0;
        const profileCompleted = Number(extrasRow?.profile_completed) === 1;

        const payload = {
          points: totalPoints,
          tier,
          purchasesCount,
          breakdown,
          progress: { percent, current: currentForProgress, nextThreshold, nextTier },
          phrase,
          flags: {
            profileCompleted,
            spinCredits,
            canSpin: spinCredits > 0,
          }
        };
        memory.loyalty[userId] = payload;
        memory.loyaltyFlags[userId] = memory.loyaltyFlags[userId] || { profileCompleted: false, lastSpinDate: null, spinCredits: 0 };
        memory.loyaltyFlags[userId].profileCompleted = profileCompleted;
        memory.loyaltyFlags[userId].spinCredits = spinCredits;
        return res.json(payload);
      } catch (err) {
        void 0;
      }
      const current = memory.loyalty[userId] || { points: 0, tier: 'Bronze', purchasesCount: 0, breakdown: { purchases: 0, referral: 0, profile: 0, review: 0, social: 0 }, progress: { percent: 0, current: 0, nextThreshold: 3, nextTier: 'Silver' }, phrase: '' };
      return res.json(current);
    })();
    return;
  }
  const orders = (memory.orders || []).filter(o => (o.customer || '').toLowerCase() === userId);
  const purchasesCount = orders.length;
  const amount = orders.reduce((acc, o) => acc + (o.items || []).reduce((a, it) => a + ((it.price || 0) * (it.qty || it.quantity || 1)), 0), 0);
  const purchasesPoints = Math.floor(amount / 1000); // 1 punto por cada $1000 gastados

  // Extras guardados en memoria (si no existen, iniciar en 0)
  const current = memory.loyalty[userId] || {};
  const referral = Number(current?.breakdown?.referral || 0);
  const profile = Number(current?.breakdown?.profile || 0);
  const review = Number(current?.breakdown?.review || 0);
  const social = Number(current?.breakdown?.social || 0);
  const breakdown = { purchases: purchasesPoints, referral, profile, review, social };

  // Niveles por cantidad de compras (según propuesta):
  // Bronze: default; Silver: 3 compras o más; Gold: clientes frecuentes (>=7 compras)
  let tier = 'Bronze';
  if (purchasesCount >= 7) tier = 'Gold';
  else if (purchasesCount >= 3) tier = 'Silver';

  // Progreso hacia el próximo nivel por número de compras
  const nextTier = tier === 'Gold' ? null : (tier === 'Silver' ? 'Gold' : 'Silver');
  const nextThreshold = tier === 'Gold' ? null : (tier === 'Silver' ? 7 : 3);
  const currentForProgress = purchasesCount;
  const percent = nextThreshold ? Math.min(100, Math.round((currentForProgress / nextThreshold) * 100)) : 100;

  const totalPoints = breakdown.purchases + breakdown.referral + breakdown.profile + breakdown.review + breakdown.social;
  const phrase = 'Tu estilo vale más de lo que pensás. Cada compra te acerca a nuevos beneficios.';

  const payload = {
    points: totalPoints,
    tier,
    purchasesCount,
    breakdown,
    progress: { percent, current: currentForProgress, nextThreshold, nextTier },
    phrase,
    flags: {
      profileCompleted: !!(memory.loyaltyFlags[userId]?.profileCompleted),
      spinCredits: Number(memory.loyaltyFlags[userId]?.spinCredits || 0),
      canSpin: (Number(memory.loyaltyFlags[userId]?.spinCredits || 0) > 0)
    }
  };
  memory.loyalty[userId] = payload;
  res.json(payload);
});

// Sumar puntos por acciones (referidos, perfil, reseñas, redes, ruleta)
app.post('/api/user/loyalty/earn', (req, res) => {
  const userId = (req.query.user || 'guest').toLowerCase();
  const { type } = req.body || {};
  const valid = new Set(['referral','profile','review','social','spin']);
  if (!valid.has(type)) return res.status(400).json({ ok: false, error: 'Tipo de acción inválido' });

  if (DB_ENABLED && userId !== 'guest') {
    (async () => {
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS user_loyalty (
            user_email VARCHAR(255) NOT NULL,
            referral_points INT NOT NULL DEFAULT 0,
            profile_points INT NOT NULL DEFAULT 0,
            review_points INT NOT NULL DEFAULT 0,
            social_points INT NOT NULL DEFAULT 0,
            spin_credits INT NOT NULL DEFAULT 0,
            profile_completed TINYINT(1) NOT NULL DEFAULT 0,
            last_spin_date DATE NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
        );

        const statsRes = await db.query(
          `SELECT
             COUNT(DISTINCT o.id) AS orders_count,
             COALESCE(SUM(COALESCE(NULLIF(o.total, 0),
               (SELECT COALESCE(SUM(oi.qty * oi.price), 0) FROM order_items oi WHERE oi.order_id = o.id)
             )), 0) AS amount
           FROM orders o
           WHERE LOWER(o.customer) = ? OR LOWER(o.customer_email) = ?`,
          [userId, userId]
        );
        const statsRow = Array.isArray(statsRes.rows) ? statsRes.rows[0] : null;
        const purchasesCount = Number(statsRow?.orders_count) || 0;
        const amount = Number(statsRow?.amount) || 0;
        const purchasesPoints = Math.floor(amount / 1000);

        const extrasRes = await db.query(
          'SELECT referral_points, profile_points, review_points, social_points, spin_credits, profile_completed, last_spin_date FROM user_loyalty WHERE user_email = ? LIMIT 1',
          [userId]
        );
        const extrasRow = Array.isArray(extrasRes.rows) ? extrasRes.rows[0] : null;
        const breakdown = {
          purchases: purchasesPoints,
          referral: Number(extrasRow?.referral_points) || 0,
          profile: Number(extrasRow?.profile_points) || 0,
          review: Number(extrasRow?.review_points) || 0,
          social: Number(extrasRow?.social_points) || 0,
        };
        let spinCredits = Number(extrasRow?.spin_credits) || 0;
        let profileCompleted = Number(extrasRow?.profile_completed) === 1;

        let earned = 0;
        let info = '';
        const today = new Date().toISOString().slice(0, 10);
        let lastSpinDate = extrasRow?.last_spin_date || null;

        if (type === 'referral') { earned = 50; info = 'invitar amigos'; breakdown.referral += earned; }
        if (type === 'profile') {
          if (profileCompleted) { earned = 0; info = 'perfil ya acreditado'; }
          else { earned = 20; info = 'completar tu perfil'; breakdown.profile += earned; profileCompleted = true; }
        }
        if (type === 'review') { earned = 10; info = 'tu reseña'; breakdown.review += earned; }
        if (type === 'social') { earned = 5; info = 'tu publicación en redes'; breakdown.social += earned; }
        if (type === 'spin') {
          if (spinCredits <= 0) { earned = 0; info = 'sin créditos de ruleta'; }
          else {
            const options = [0, 5, 10, 15, 20];
            earned = options[Math.floor(Math.random() * options.length)];
            spinCredits = Math.max(0, spinCredits - 1);
            lastSpinDate = today;
            info = earned > 0 ? `ruleta (+${earned})` : 'ruleta (sin puntos)';
            breakdown.social += earned;
          }
        }

        let tier = 'Bronze';
        if (purchasesCount >= 7) tier = 'Gold';
        else if (purchasesCount >= 3) tier = 'Silver';
        const nextTier = tier === 'Gold' ? null : (tier === 'Silver' ? 'Gold' : 'Silver');
        const nextThreshold = tier === 'Gold' ? null : (tier === 'Silver' ? 7 : 3);
        const percent = nextThreshold ? Math.min(100, Math.round((purchasesCount / nextThreshold) * 100)) : 100;
        const phrase = 'Tu estilo vale más de lo que pensás. Cada compra te acerca a nuevos beneficios.';
        const points = breakdown.purchases + breakdown.referral + breakdown.profile + breakdown.review + breakdown.social;

        await db.query(
          `INSERT INTO user_loyalty (user_email, referral_points, profile_points, review_points, social_points, spin_credits, profile_completed, last_spin_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             referral_points = VALUES(referral_points),
             profile_points = VALUES(profile_points),
             review_points = VALUES(review_points),
             social_points = VALUES(social_points),
             spin_credits = VALUES(spin_credits),
             profile_completed = VALUES(profile_completed),
             last_spin_date = VALUES(last_spin_date)`,
          [
            userId,
            breakdown.referral,
            breakdown.profile,
            breakdown.review,
            breakdown.social,
            spinCredits,
            profileCompleted ? 1 : 0,
            lastSpinDate ? String(lastSpinDate).slice(0, 10) : null,
          ]
        );

        const payload = {
          points,
          tier,
          purchasesCount,
          breakdown,
          progress: { percent, current: purchasesCount, nextThreshold, nextTier },
          phrase,
          flags: {
            profileCompleted,
            spinCredits,
            canSpin: spinCredits > 0,
          }
        };

        memory.loyalty[userId] = payload;
        memory.loyaltyFlags[userId] = memory.loyaltyFlags[userId] || { profileCompleted: false, lastSpinDate: null, spinCredits: 0 };
        memory.loyaltyFlags[userId].profileCompleted = profileCompleted;
        memory.loyaltyFlags[userId].spinCredits = spinCredits;
        memory.loyaltyFlags[userId].lastSpinDate = lastSpinDate;

        memory.notifications[userId] = memory.notifications[userId] || [];
        const msg = type === 'spin'
          ? ((spinCredits <= 0 && earned === 0)
              ? 'No tienes créditos de ruleta disponibles. ¡Realiza una compra para obtener giros!'
              : (earned > 0 ? `🎉 ¡Ganaste ${earned} puntos JJ en la ruleta!` : '🤏 Esta vez la ruleta no sumó puntos. ¡Suerte la próxima!'))
          : (earned > 0 ? `+${earned} puntos JJ por ${info}` : `Sin puntos por ${info}`);
        memory.notifications[userId].push({ id: Date.now(), message: msg, ts: new Date().toISOString(), read: false });

        return res.json({ ok: true, loyalty: payload, earned });
      } catch (err) {
        void 0;
      }
      return res.status(500).json({ ok: false, error: 'No se pudo procesar la acción' });
    })();
    return;
  }

  // Asegurar estado actual
  const orders = (memory.orders || []).filter(o => (o.customer || '').toLowerCase() === userId);
  const purchasesCount = orders.length;
  const amount = orders.reduce((acc, o) => acc + (o.items || []).reduce((a, it) => a + ((it.price || 0) * (it.qty || it.quantity || 1)), 0), 0);
  const purchasesPoints = Math.floor(amount / 1000);

  const current = memory.loyalty[userId] || { breakdown: { purchases: purchasesPoints, referral: 0, profile: 0, review: 0, social: 0 } };
  const breakdown = {
    purchases: purchasesPoints,
    referral: Number(current.breakdown?.referral || 0),
    profile: Number(current.breakdown?.profile || 0),
    review: Number(current.breakdown?.review || 0),
    social: Number(current.breakdown?.social || 0),
  };

  // Flags
  memory.loyaltyFlags[userId] = memory.loyaltyFlags[userId] || { profileCompleted: false, lastSpinDate: null };
  const today = new Date().toISOString().slice(0,10);
  // Asegurar crédito
  if (typeof memory.loyaltyFlags[userId].spinCredits !== 'number') {
    memory.loyaltyFlags[userId].spinCredits = 0;
  }

  // Reglas de puntos con flags
  let earned = 0;
  let info = '';
  if (type === 'referral') { earned = 50; info = 'invitar amigos'; }
  if (type === 'profile') {
    if (memory.loyaltyFlags[userId].profileCompleted) {
      earned = 0; info = 'perfil ya acreditado';
    } else {
      earned = 20; info = 'completar tu perfil';
      memory.loyaltyFlags[userId].profileCompleted = true;
    }
  }
  if (type === 'review') { earned = 10; info = 'tu reseña'; }
  if (type === 'social') { earned = 5; info = 'tu publicación en redes'; }
  if (type === 'spin') {                // Ruleta de la suerte (consumir crédito por compra)
    if ((memory.loyaltyFlags[userId].spinCredits || 0) <= 0) {
      earned = 0; info = 'sin créditos de ruleta';
    } else {
      const options = [0, 5, 10, 15, 20];
      earned = options[Math.floor(Math.random() * options.length)];
      memory.loyaltyFlags[userId].spinCredits = Math.max(0, (memory.loyaltyFlags[userId].spinCredits || 0) - 1);
      memory.loyaltyFlags[userId].lastSpinDate = today;
      info = earned > 0 ? `ruleta (+${earned})` : 'ruleta (sin puntos)';
    }
  }

  // Actualizar desglose
  if (type === 'referral') breakdown.referral += earned;
  if (type === 'profile') breakdown.profile += earned;
  if (type === 'review') breakdown.review += earned;
  if (type === 'social' || type === 'spin') breakdown.social += earned;

  // Recalcular tier y progreso
  let tier = 'Bronze';
  if (purchasesCount >= 7) tier = 'Gold';
  else if (purchasesCount >= 3) tier = 'Silver';
  const nextTier = tier === 'Gold' ? null : (tier === 'Silver' ? 'Gold' : 'Silver');
  const nextThreshold = tier === 'Gold' ? null : (tier === 'Silver' ? 7 : 3);
  const percent = nextThreshold ? Math.min(100, Math.round((purchasesCount / nextThreshold) * 100)) : 100;

  const phrase = 'Tu estilo vale más de lo que pensás. Cada compra te acerca a nuevos beneficios.';
  const points = breakdown.purchases + breakdown.referral + breakdown.profile + breakdown.review + breakdown.social;
  const payload = {
    points,
    tier,
    purchasesCount,
    breakdown,
    progress: { percent, current: purchasesCount, nextThreshold, nextTier },
    phrase,
    flags: {
      profileCompleted: !!memory.loyaltyFlags[userId]?.profileCompleted,
      spinCredits: Number(memory.loyaltyFlags[userId]?.spinCredits || 0),
      canSpin: (Number(memory.loyaltyFlags[userId]?.spinCredits || 0) > 0)
    }
  };
  memory.loyalty[userId] = payload;

  // Crear notificación automática
  memory.notifications[userId] = memory.notifications[userId] || [];
  const msg = type === 'spin'
    ? ((memory.loyaltyFlags[userId].spinCredits || 0) <= 0 && earned === 0
        ? 'No tienes créditos de ruleta disponibles. ¡Realiza una compra para obtener giros!'
        : (earned > 0 ? `🎉 ¡Ganaste ${earned} puntos JJ en la ruleta!` : '🤏 Esta vez la ruleta no sumó puntos. ¡Suerte la próxima!'))
    : (earned > 0 ? `+${earned} puntos JJ por ${info}` : `Sin puntos por ${info}`);
  memory.notifications[userId].push({ id: Date.now(), message: msg, ts: new Date().toISOString(), read: false });

  res.json({ ok: true, loyalty: payload, earned });
});

// Servir frontend compilado y fallback SPA si existe dist
try {
  const distDir = path.join(__dirname, '../../frontend/dist');
  if ((process.env.SERVE_FRONTEND || 'true').toLowerCase() !== 'false' && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    // Fallback SPA sin usar path-to-regexp con '*', compatible con Express 5
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(distDir, 'index.html'));
    });
    console.log('Frontend dist habilitado desde', distDir);
  } else {
    console.log('Frontend dist no encontrado o deshabilitado');
  }
} catch (err) {
  console.warn('No se pudo configurar el servido de frontend dist:', err?.message || String(err));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
