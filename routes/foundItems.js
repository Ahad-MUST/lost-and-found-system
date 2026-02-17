// routes/foundItems.js
const express = require('express');
const router  = express.Router();
const { requireLogin } = require('../middleware/auth');

const CATEGORIES = ['Electronics', 'Documents', 'Accessories', 'Books', 'Keys', 'Wallet', 'Bag', 'Other'];

// !! /new and /:id/edit MUST come before /:id catch-all !!

// GET /found-items/new
router.get('/new', requireLogin, (req, res) => {
  res.render('found-form', { item: null, categories: CATEGORIES, error: null });
});

// GET /found-items/:id/edit
router.get('/:id/edit', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM Found_Items WHERE ItemID = ? AND UserID = ?', [id, userID]);
    if (!rows.length) return res.redirect('/dashboard');
    res.render('found-form', { item: rows[0], categories: CATEGORIES, error: null });
  } catch (err) { res.redirect('/dashboard'); }
});

// GET /found-items/:id — Detail page with smart match
router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT f.*, u.Name AS ReporterName, u.Email AS ReporterEmail, u.Phone AS ReporterPhone FROM Found_Items f JOIN Users u ON f.UserID = u.UserID WHERE f.ItemID = ?',
      [id]
    );
    if (!rows.length) return res.redirect('/');
    const item = rows[0];
    const [matches] = await pool.execute(
      'SELECT l.*, u.Name AS ReporterName FROM Lost_Items l JOIN Users u ON l.UserID = u.UserID WHERE l.Category = ? AND l.Status = "Active" AND l.ItemID != ? ORDER BY l.DateLost DESC LIMIT 4',
      [item.Category, item.ItemID]
    );
    res.render('item-detail', { item, matches, type: 'found' });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// POST /found-items
router.post('/', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { itemName, category, description, dateFound, locationFound } = req.body;
  if (!itemName || !category || !description || !dateFound || !locationFound)
    return res.render('found-form', { item: null, categories: CATEGORIES, error: 'All fields are required.' });
  try {
    await pool.execute(
      'INSERT INTO Found_Items (UserID, ItemName, Category, Description, DateFound, LocationFound) VALUES (?, ?, ?, ?, ?, ?)',
      [userID, itemName, category, description, dateFound, locationFound]
    );
    req.session.flash = { type: 'success', msg: 'Found item posted successfully!' };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('found-form', { item: null, categories: CATEGORIES, error: 'Could not save. Please try again.' });
  }
});

// POST /found-items/:id/update
router.post('/:id/update', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { id } = req.params;
  const { itemName, category, description, dateFound, locationFound } = req.body;
  if (!itemName || !category || !description || !dateFound || !locationFound)
    return res.render('found-form', { item: { ItemID: id, ...req.body }, categories: CATEGORIES, error: 'All fields are required.' });
  try {
    await pool.execute(
      'UPDATE Found_Items SET ItemName=?, Category=?, Description=?, DateFound=?, LocationFound=? WHERE ItemID=? AND UserID=?',
      [itemName, category, description, dateFound, locationFound, id, userID]
    );
    req.session.flash = { type: 'success', msg: 'Item updated successfully.' };
    res.redirect('/dashboard');
  } catch (err) { res.redirect('/dashboard'); }
});

// POST /found-items/:id/delete
router.post('/:id/delete', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const role   = req.session.user.Role;
  const { id } = req.params;
  try {
    if (role === 'Admin') await pool.execute('DELETE FROM Found_Items WHERE ItemID = ?', [id]);
    else await pool.execute('DELETE FROM Found_Items WHERE ItemID = ? AND UserID = ?', [id, userID]);
    req.session.flash = { type: 'success', msg: 'Item deleted.' };
  } catch (err) { console.error(err); }
  res.redirect(req.get('Referer') || '/dashboard');
});

// POST /found-items/:id/claim
router.post('/:id/claim', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const role   = req.session.user.Role;
  const { id } = req.params;
  try {
    if (role === 'Admin') await pool.execute('UPDATE Found_Items SET Status="Claimed" WHERE ItemID=?', [id]);
    else await pool.execute('UPDATE Found_Items SET Status="Claimed" WHERE ItemID=? AND UserID=?', [id, userID]);
    req.session.flash = { type: 'success', msg: 'Marked as claimed!' };
  } catch (err) { console.error(err); }
  res.redirect(req.get('Referer') || '/dashboard');
});

module.exports = router;