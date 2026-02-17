// routes/lostItems.js
const express = require('express');
const router  = express.Router();
const { requireLogin } = require('../middleware/auth');

const CATEGORIES = ['Electronics', 'Documents', 'Accessories', 'Books', 'Keys', 'Wallet', 'Bag', 'Other'];

// !! /new and /:id/edit MUST come before /:id catch-all !!

// GET /lost-items/new
router.get('/new', requireLogin, (req, res) => {
  res.render('lost-form', { item: null, categories: CATEGORIES, error: null });
});

// GET /lost-items/:id/edit
router.get('/:id/edit', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const { id } = req.params;
  const userID = req.session.user.UserID;
  try {
    const [rows] = await pool.execute('SELECT * FROM Lost_Items WHERE ItemID = ? AND UserID = ?', [id, userID]);
    if (!rows.length) return res.redirect('/dashboard');
    res.render('lost-form', { item: rows[0], categories: CATEGORIES, error: null });
  } catch (err) { res.redirect('/dashboard'); }
});

// GET /lost-items/:id — Detail page with smart match
router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT l.*, u.Name AS ReporterName, u.Email AS ReporterEmail, u.Phone AS ReporterPhone FROM Lost_Items l JOIN Users u ON l.UserID = u.UserID WHERE l.ItemID = ?',
      [id]
    );
    if (!rows.length) return res.redirect('/');
    const item = rows[0];
    const [matches] = await pool.execute(
      'SELECT f.*, u.Name AS ReporterName FROM Found_Items f JOIN Users u ON f.UserID = u.UserID WHERE f.Category = ? AND f.Status = "Active" AND f.ItemID != ? ORDER BY f.DateFound DESC LIMIT 4',
      [item.Category, item.ItemID]
    );
    res.render('item-detail', { item, matches, type: 'lost' });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// POST /lost-items
router.post('/', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { itemName, category, description, dateLost, locationLost } = req.body;
  if (!itemName || !category || !description || !dateLost || !locationLost)
    return res.render('lost-form', { item: null, categories: CATEGORIES, error: 'All fields are required.' });
  try {
    await pool.execute(
      'INSERT INTO Lost_Items (UserID, ItemName, Category, Description, DateLost, LocationLost) VALUES (?, ?, ?, ?, ?, ?)',
      [userID, itemName, category, description, dateLost, locationLost]
    );
    req.session.flash = { type: 'success', msg: 'Lost item reported successfully!' };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('lost-form', { item: null, categories: CATEGORIES, error: 'Could not save. Please try again.' });
  }
});

// POST /lost-items/:id/update
router.post('/:id/update', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { id } = req.params;
  const { itemName, category, description, dateLost, locationLost } = req.body;
  if (!itemName || !category || !description || !dateLost || !locationLost)
    return res.render('lost-form', { item: { ItemID: id, ...req.body }, categories: CATEGORIES, error: 'All fields are required.' });
  try {
    await pool.execute(
      'UPDATE Lost_Items SET ItemName=?, Category=?, Description=?, DateLost=?, LocationLost=? WHERE ItemID=? AND UserID=?',
      [itemName, category, description, dateLost, locationLost, id, userID]
    );
    req.session.flash = { type: 'success', msg: 'Item updated successfully.' };
    res.redirect('/dashboard');
  } catch (err) { res.redirect('/dashboard'); }
});

// POST /lost-items/:id/delete
router.post('/:id/delete', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const role   = req.session.user.Role;
  const { id } = req.params;
  try {
    if (role === 'Admin') await pool.execute('DELETE FROM Lost_Items WHERE ItemID = ?', [id]);
    else await pool.execute('DELETE FROM Lost_Items WHERE ItemID = ? AND UserID = ?', [id, userID]);
    req.session.flash = { type: 'success', msg: 'Item deleted.' };
  } catch (err) { console.error(err); }
  res.redirect(req.get('Referer') || '/dashboard');
});

// POST /lost-items/:id/recover
router.post('/:id/recover', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const role   = req.session.user.Role;
  const { id } = req.params;
  try {
    if (role === 'Admin') await pool.execute('UPDATE Lost_Items SET Status="Recovered" WHERE ItemID=?', [id]);
    else await pool.execute('UPDATE Lost_Items SET Status="Recovered" WHERE ItemID=? AND UserID=?', [id, userID]);
    req.session.flash = { type: 'success', msg: 'Marked as recovered!' };
  } catch (err) { console.error(err); }
  res.redirect(req.get('Referer') || '/dashboard');
});

module.exports = router;