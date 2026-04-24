/**
 * contact.node.js — Node.js / Express-compatible receiver for the
 * contact form. Functionally identical to contact.php.
 *
 * Install:
 *   npm install express body-parser nodemailer
 *
 * Run standalone:
 *   node contact.node.js
 *
 * Or mount in an existing Express app:
 *   const contact = require('./contact.node.js');
 *   app.post('/contact', contact.handler);
 *
 * Configure:
 *   RECIPIENT  – where submissions land
 *   FROM       – From: address
 *   SITE_NAME  – used in subject line
 *   SMTP_*     – transport config (see nodemailer docs).
 *                If unset, falls back to local `sendmail` (requires
 *                a working MTA on the host).
 */

'use strict';

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// ---- CONFIG -----------------------------------------------------------
const RECIPIENT = process.env.CONTACT_TO   || 'wernsdorfer@gmail.com';
const FROM      = process.env.CONTACT_FROM || 'noreply@markwernsdorfer.com';
const SITE_NAME = process.env.SITE_NAME    || 'markwernsdorfer.com';
const PORT      = parseInt(process.env.PORT || '3000', 10);
const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 3600;
const RATE_DIR = path.join(os.tmpdir(), 'wc_contact_rate');
// ---- END CONFIG -------------------------------------------------------

// Lazy-load nodemailer only if present (so the script still runs as a
// documentation read-through without crashing when nodemailer is missing).
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const nodemailer = require('nodemailer');
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
  } else {
    transporter = nodemailer.createTransport({ sendmail: true, path: '/usr/sbin/sendmail' });
  }
  return transporter;
}

// Simple file-based rate limiter — one file per IP-hour bucket.
try { fs.mkdirSync(RATE_DIR, { recursive: true, mode: 0o700 }); } catch (e) {}
function rateCheck(ip) {
  const bucket = path.join(
    RATE_DIR,
    crypto.createHash('md5').update(ip).digest('hex') + '_' + Math.floor(Date.now() / 1000 / RATE_WINDOW_SEC)
  );
  let count = 0;
  try { count = parseInt(fs.readFileSync(bucket, 'utf8'), 10) || 0; } catch (e) {}
  if (count >= RATE_LIMIT) return { ok: false, bucket, count };
  fs.writeFileSync(bucket, String(count + 1));
  return { ok: true, bucket, count: count + 1 };
}
function rateRollback(bucket, count) {
  try { fs.writeFileSync(bucket, String(Math.max(0, count - 1))); } catch (e) {}
}

// The handler — usable as an Express route (req.body already parsed) OR
// as a raw Node http handler (we parse ourselves).
async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  // Body parsing — support Express-parsed body OR raw stream
  let body = req.body;
  if (!body) {
    const raw = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
    const ct = req.headers['content-type'] || '';
    if (ct.includes('application/json')) {
      try { body = JSON.parse(raw || '{}'); } catch (e) { body = {}; }
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      body = Object.fromEntries(new URLSearchParams(raw));
    } else {
      body = {};
    }
  }

  const get = (k) => (body[k] == null ? '' : String(body[k]).trim());

  // Honeypot
  if (get('website') !== '') {
    return res.end(JSON.stringify({ ok: true, honeypot: true }));
  }

  const name  = get('name');
  const email = get('email');
  const org   = get('org');
  const topic = get('topic');
  const msg   = get('msg');
  const nda   = !!body.nda && body.nda !== '0';

  if (!name || !email || !msg) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Required fields missing', fields: ['name', 'email', 'msg'] }));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid email' }));
  }
  if (msg.length > 10000 || name.length > 200 || org.length > 200) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Field too long' }));
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const limit = rateCheck(String(ip).split(',')[0].trim());
  if (!limit.ok) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }));
  }

  // Compose + send
  const safeEmail = email.replace(/[\r\n]+/g, ' ');
  const safeName  = name.replace(/[\r\n]+/g, ' ');
  const subject   = `Anfrage über ${SITE_NAME} — ${topic || 'Allgemein'}`;
  const text =
    'Neue Anfrage vom Kontaktformular\n' +
    '=================================\n\n' +
    `Name:          ${safeName}\n` +
    `E-Mail:        ${safeEmail}\n` +
    `Organisation:  ${org}\n` +
    `Thema:         ${topic}\n` +
    `NDA benötigt:  ${nda ? 'ja' : 'nein'}\n\n` +
    'Nachricht:\n' +
    '-'.repeat(40) + '\n' +
    msg + '\n' +
    '-'.repeat(40) + '\n\n' +
    `IP: ${ip}\n` +
    `Zeit: ${new Date().toISOString()}\n`;

  try {
    await getTransporter().sendMail({
      from: FROM,
      replyTo: `${safeName} <${safeEmail}>`,
      to: RECIPIENT,
      subject,
      text
    });
    return res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    rateRollback(limit.bucket, limit.count);
    console.error('contact send failed', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Mail send failed. Please email us directly.' }));
  }
}

// Export for Express / serverless use
module.exports = { handler };

// Standalone: `node contact.node.js` starts a tiny HTTP server that
// responds only on /contact.
if (require.main === module) {
  const server = http.createServer((req, res) => {
    const { pathname } = url.parse(req.url || '/');
    if (pathname === '/contact' || pathname === '/contact.php') {
      return handler(req, res);
    }
    res.statusCode = 404;
    res.end('Not found');
  });
  server.listen(PORT, () => {
    console.log(`contact.node.js listening on :${PORT}/contact`);
  });
}
