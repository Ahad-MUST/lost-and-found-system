// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const { requireLogin } = require('../middleware/auth');

const ITEMS_PER_PAGE = 9;

// GET / — Home with browse, filters, pagination, stats
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const category  = req.query.category  || '';
    const search    = req.query.search    || '';
    const dateFrom  = req.query.dateFrom  || '';
    const dateTo    = req.query.dateTo    || '';
    const tab       = req.query.tab       || 'lost';
    const page      = Math.max(1, parseInt(req.query.page) || 1);
    const offset    = (page - 1) * ITEMS_PER_PAGE;

    // Build WHERE for lost items
    let lostWhere  = 'l.Status = "Active"';
    let foundWhere = 'f.Status = "Active"';
    const lostParams  = [];
    const foundParams = [];

    if (category) {
      lostWhere  += ' AND l.Category = ?'; lostParams.push(category);
      foundWhere += ' AND f.Category = ?'; foundParams.push(category);
    }
    if (search) {
      const like = `%${search}%`;
      lostWhere  += ' AND (l.ItemName LIKE ? OR l.Description LIKE ? OR l.LocationLost LIKE ?)';
      lostParams.push(like, like, like);
      foundWhere += ' AND (f.ItemName LIKE ? OR f.Description LIKE ? OR f.LocationFound LIKE ?)';
      foundParams.push(like, like, like);
    }
    if (dateFrom) {
      lostWhere  += ' AND l.DateLost >= ?';  lostParams.push(dateFrom);
      foundWhere += ' AND f.DateFound >= ?'; foundParams.push(dateFrom);
    }
    if (dateTo) {
      lostWhere  += ' AND l.DateLost <= ?';  lostParams.push(dateTo);
      foundWhere += ' AND f.DateFound <= ?'; foundParams.push(dateTo);
    }

    // Count totals for pagination
    const [[{ lostCount }]]  = await pool.execute(
      `SELECT COUNT(*) AS lostCount FROM Lost_Items l WHERE ${lostWhere}`, lostParams);
    const [[{ foundCount }]] = await pool.execute(
      `SELECT COUNT(*) AS foundCount FROM Found_Items f WHERE ${foundWhere}`, foundParams);

    const activeCount = tab === 'lost' ? lostCount : foundCount;
    const totalPages  = Math.ceil(activeCount / ITEMS_PER_PAGE);

    // Paginated results — LIMIT/OFFSET inlined as safe integers (mysql2 prepared statements reject mixed-type arrays)
    const limit  = parseInt(ITEMS_PER_PAGE);
    const safeOffset = parseInt(offset);
    const [lostItems] = await pool.execute(
      `SELECT l.*, u.Name AS ReporterName FROM Lost_Items l JOIN Users u ON l.UserID = u.UserID WHERE ${lostWhere} ORDER BY l.CreatedAt DESC LIMIT ${limit} OFFSET ${safeOffset}`,
      lostParams
    );
    const [foundItems] = await pool.execute(
      `SELECT f.*, u.Name AS ReporterName FROM Found_Items f JOIN Users u ON f.UserID = u.UserID WHERE ${foundWhere} ORDER BY f.CreatedAt DESC LIMIT ${limit} OFFSET ${safeOffset}`,
      foundParams
    );

    // Global stats for banner
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM Lost_Items)              AS totalLost,
        (SELECT COUNT(*) FROM Found_Items)             AS totalFound,
        (SELECT COUNT(*) FROM Lost_Items WHERE Status="Recovered") AS totalRecovered,
        (SELECT COUNT(*) FROM Users WHERE Role="User") AS totalUsers
    `);

    res.render('index', {
      lostItems, foundItems, search, category, dateFrom, dateTo, tab,
      page, totalPages, lostCount, foundCount, stats, error: null
    });
  } catch (err) {
    console.error(err);
    res.render('index', {
      lostItems: [], foundItems: [], search: '', category: '', dateFrom: '', dateTo: '',
      tab: 'lost', page: 1, totalPages: 1, lostCount: 0, foundCount: 0,
      stats: { totalLost: 0, totalFound: 0, totalRecovered: 0, totalUsers: 0 },
      error: 'Could not load items.'
    });
  }
});

// GET /register
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { error: null });
});

// POST /register
router.post('/register', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, email, password, confirm, phone } = req.body;
  if (!name || !email || !password || !confirm)
    return res.render('register', { error: 'All required fields must be filled.' });
  if (password !== confirm)
    return res.render('register', { error: 'Passwords do not match.' });
  if (password.length < 6)
    return res.render('register', { error: 'Password must be at least 6 characters.' });
  try {
    const [existing] = await pool.execute('SELECT UserID FROM Users WHERE Email = ?', [email]);
    if (existing.length > 0)
      return res.render('register', { error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO Users (Name, Email, Password, Phone) VALUES (?, ?, ?, ?)',
      [name, email, hashed, phone || null]
    );
    res.redirect('/login?registered=1');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null, registered: req.query.registered === '1' });
});

// POST /login
router.post('/login', async (req, res) => {
  const pool = req.app.locals.pool;
  const { email, password } = req.body;
  if (!email || !password)
    return res.render('login', { error: 'Both fields are required.', registered: false });
  try {
    const [rows] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].Password)))
      return res.render('login', { error: 'Invalid email or password.', registered: false });
    const u = rows[0];
    req.session.user = { UserID: u.UserID, Name: u.Name, Email: u.Email, Role: u.Role };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Login failed. Please try again.', registered: false });
  }
});

// GET /logout
router.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

// GET /dashboard
router.get('/dashboard', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const dsearch = req.query.dsearch || '';
  try {
    let lostQ  = 'SELECT * FROM Lost_Items  WHERE UserID = ?';
    let foundQ = 'SELECT * FROM Found_Items WHERE UserID = ?';
    const lp = [userID], fp = [userID];
    if (dsearch) {
      const like = `%${dsearch}%`;
      lostQ  += ' AND (ItemName LIKE ? OR Category LIKE ? OR LocationLost LIKE ?)';
      foundQ += ' AND (ItemName LIKE ? OR Category LIKE ? OR LocationFound LIKE ?)';
      lp.push(like, like, like);
      fp.push(like, like, like);
    }
    lostQ  += ' ORDER BY CreatedAt DESC';
    foundQ += ' ORDER BY CreatedAt DESC';
    const [lostItems]  = await pool.execute(lostQ,  lp);
    const [foundItems] = await pool.execute(foundQ, fp);
    res.render('dashboard', { lostItems, foundItems, dsearch, flash: res.locals.flash });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { lostItems: [], foundItems: [], dsearch: '', flash: null });
  }
});

module.exports = router;