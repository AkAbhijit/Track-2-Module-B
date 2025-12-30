const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');

const User = require('./models/user');
const UserToken = require('./models/userToken');
const Category = require('./models/category');
const Application = require('./models/application');
const BalanceHistory = require('./models/balanceHistory');
const Bicycle = require('./models/bicycle');
const Booking = require('./models/booking');
const PromoCode = require('./models/promoCode');
const Tariff = require('./models/tariff');

function splitTopLevelGroups(s) {
  const groups = [];
  let cur = '';
  let level = 0;
  let inQuote = false;
  let quoteChar = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    cur += ch;
    if ((ch === '"' || ch === "'") && s[i - 1] !== '\\') {
      if (!inQuote) { inQuote = true; quoteChar = ch; }
      else if (quoteChar === ch) { inQuote = false; quoteChar = ''; }
    }
    if (!inQuote) {
      if (ch === '(') level++;
      else if (ch === ')') level--;
      if (level === 0 && s[i + 1] === ',') {
        groups.push(cur.trim());
        cur = '';
        i++; // skip comma
      }
    }
  }
  if (cur.trim()) groups.push(cur.trim());
  return groups;
}

function parseRow(row) {
  let s = row.trim();
  if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1);
  const values = [];
  let cur = '';
  let inQuote = false;
  let quoteChar = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ((ch === '"' || ch === "'") && s[i - 1] !== '\\') {
      if (!inQuote) { inQuote = true; quoteChar = ch; cur += ch; continue; }
      else if (quoteChar === ch) { inQuote = false; cur += ch; continue; }
    }
    if (!inQuote && ch === ',') {
      values.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim() !== '') values.push(cur.trim());
  return values.map(v => {
    if (/^NULL$/i.test(v)) return null;
    if (/^'(.*)'$/s.test(v) || /^"(.*)"$/s.test(v)) {
      // strip surrounding quotes
      const inner = v.replace(/^'(.*)'$/s, '$1').replace(/^"(.*)"$/s, '$1');
      // unescape SQL-style escapes: \' and \" and \\ and \n etc.
      return inner.replace(/\\'/g, "'").replace(/\\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    }
    if (/^-?\d+$/.test(v)) return Number(v);
    if (/^-?\d+\.\d+$/.test(v)) return Number(v);
    return v;
  });
}

function parseInserts(sql) {
  const inserts = {};
  const re = /INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*([^;]+);/gims;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const table = m[1];
    const cols = m[2].split(',').map(c => c.replace(/`/g, '').trim());
    const valuesBlock = m[3].trim();
    // valuesBlock may be like '(...),(...),(... )'
    const groups = splitTopLevelGroups(valuesBlock);
    const rows = groups.map(g => parseRow(g));
    inserts[table] = inserts[table] || [];
    for (const row of rows) {
      const obj = {};
      cols.forEach((col, idx) => { obj[col] = row[idx]; });
      inserts[table].push(obj);
    }
  }
  return inserts;
}

async function seed() {
  await connectDB();

  const sqlPath = path.join(__dirname, '..', 'IS2025-module-b.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found at', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const inserts = parseInserts(sql);

  try {
    // Clear collections
    await Promise.all([
      User.deleteMany({}), UserToken.deleteMany({}), Category.deleteMany({}), Application.deleteMany({}),
      BalanceHistory.deleteMany({}), Bicycle.deleteMany({}), Booking.deleteMany({}), PromoCode.deleteMany({}), Tariff.deleteMany({})
    ]);

    // users
    if (inserts.users) {
      const users = inserts.users.map(u => ({ ...u }));
      await User.insertMany(users, { ordered: false });
      console.log('Inserted users:', users.length);
    }

    if (inserts.user_tokens) {
      const tokens = inserts.user_tokens.map(t => ({ ...t }));
      await UserToken.insertMany(tokens, { ordered: false });
      console.log('Inserted user_tokens:', tokens.length);
    }

    if (inserts.categories) {
      const cats = inserts.categories.map(c => ({ ...c }));
      await Category.insertMany(cats, { ordered: false });
      console.log('Inserted categories:', cats.length);
    }

    if (inserts.applications) {
      const apps = inserts.applications.map(a => ({ ...a }));
      await Application.insertMany(apps, { ordered: false });
      console.log('Inserted applications:', apps.length);
    }

    if (inserts.balance_histories) {
      const bh = inserts.balance_histories.map(b => {
        const copy = { ...b };
        if (copy.created_at) copy.created_at = new Date(copy.created_at);
        return copy;
      });
      await BalanceHistory.insertMany(bh, { ordered: false });
      console.log('Inserted balance_histories:', bh.length);
    }

    if (inserts.bicycles) {
      const bikes = inserts.bicycles.map(b => ({ ...b }));
      await Bicycle.insertMany(bikes, { ordered: false });
      console.log('Inserted bicycles:', bikes.length);
    }

    if (inserts.bookings) {
      const bookings = inserts.bookings.map(b => {
        const copy = { ...b };
        if (copy.started_at) copy.started_at = new Date(copy.started_at);
        if (copy.ended_at) copy.ended_at = new Date(copy.ended_at);
        // try to parse photos if it's a JSON-ish string
        if (typeof copy.photos === 'string') {
          let p = copy.photos;
          // strip surrounding quotes if present
          p = p.replace(/^"|"$/g, '');
          try { copy.photos = JSON.parse(p); } catch (e) { copy.photos = p; }
        }
        return copy;
      });
      await Booking.insertMany(bookings, { ordered: false });
      console.log('Inserted bookings:', bookings.length);
    }

    if (inserts.promo_codes) {
      const promos = inserts.promo_codes.map(p => {
        const copy = { ...p };
        if (copy.expires_at) copy.expires_at = new Date(copy.expires_at);
        return copy;
      });
      await PromoCode.insertMany(promos, { ordered: false });
      console.log('Inserted promo_codes:', promos.length);
    }

    if (inserts.tariffs) {
      const tariffs = inserts.tariffs.map(t => ({ ...t }));
      await Tariff.insertMany(tariffs, { ordered: false });
      console.log('Inserted tariffs:', tariffs.length);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
