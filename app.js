require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const mysql   = require('mysql2/promise');

const app = express();

// ── DB pool ───────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'lost_found_db',
  waitForConnections: true,
  connectionLimit:  10
});
app.locals.pool = pool;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'lf_secret_v2',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 24 * 60 * 60 * 1000 }
}));

// Expose user + flash to all templates
app.use((req, res, next) => {
  res.locals.user  = req.session.user  || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/',            require('./routes/auth'));
app.use('/lost-items',  require('./routes/lostItems'));
app.use('/found-items', require('./routes/foundItems'));
app.use('/admin',       require('./routes/admin'));
app.use('/profile',     require('./routes/profile'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).render('error', { message: 'Page not found.' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅  Lost & Found v2 running → http://localhost:${PORT}`));
