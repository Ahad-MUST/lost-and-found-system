// routes/admin.js
const express = require('express');
const router  = express.Router();
const { requireAdmin } = require('../middleware/auth');

// GET /admin
router.get('/', requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM Lost_Items)  AS totalLost,
        (SELECT COUNT(*) FROM Found_Items) AS totalFound,
        (SELECT COUNT(*) FROM Lost_Items  WHERE Status = 'Recovered') AS totalRecovered,
        (SELECT COUNT(*) FROM Found_Items WHERE Status = 'Claimed')   AS totalClaimed,
        (SELECT COUNT(*) FROM Users WHERE Role = 'User')              AS totalUsers
    `);

    const [lostItems]  = await pool.execute(
      'SELECT l.*, u.Name AS ReporterName FROM Lost_Items l JOIN Users u ON l.UserID = u.UserID ORDER BY l.CreatedAt DESC'
    );
    const [foundItems] = await pool.execute(
      'SELECT f.*, u.Name AS ReporterName FROM Found_Items f JOIN Users u ON f.UserID = u.UserID ORDER BY f.CreatedAt DESC'
    );
    const [users] = await pool.execute(
      'SELECT u.UserID, u.Name, u.Email, u.Phone, u.Role, u.CreatedAt, COUNT(DISTINCT l.ItemID) AS lostCount, COUNT(DISTINCT f.ItemID) AS foundCount FROM Users u LEFT JOIN Lost_Items l ON u.UserID = l.UserID LEFT JOIN Found_Items f ON u.UserID = f.UserID GROUP BY u.UserID ORDER BY u.CreatedAt DESC'
    );

    res.render('admin', { stats, lostItems, foundItems, users, flash: res.locals.flash });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not load admin dashboard.' });
  }
});

// POST /admin/lost/:id/toggle — toggle Active <-> Recovered
router.post('/lost/:id/toggle', requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  try {
    const [[item]] = await pool.execute('SELECT Status FROM Lost_Items WHERE ItemID = ?', [id]);
    if (item) {
      const newStatus = item.Status === 'Active' ? 'Recovered' : 'Active';
      await pool.execute('UPDATE Lost_Items SET Status = ? WHERE ItemID = ?', [newStatus, id]);
      req.session.flash = { type: 'success', msg: `Item marked as ${newStatus}.` };
    }
  } catch (err) { console.error(err); }
  res.redirect('/admin');
});

// POST /admin/found/:id/toggle — toggle Active <-> Claimed
router.post('/found/:id/toggle', requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  try {
    const [[item]] = await pool.execute('SELECT Status FROM Found_Items WHERE ItemID = ?', [id]);
    if (item) {
      const newStatus = item.Status === 'Active' ? 'Claimed' : 'Active';
      await pool.execute('UPDATE Found_Items SET Status = ? WHERE ItemID = ?', [newStatus, id]);
      req.session.flash = { type: 'success', msg: `Item marked as ${newStatus}.` };
    }
  } catch (err) { console.error(err); }
  res.redirect('/admin');
});

// POST /admin/users/:id/delete
router.post('/users/:id/delete', requireAdmin, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM Users WHERE UserID = ? AND Role = "User"', [id]);
    req.session.flash = { type: 'success', msg: 'User deleted.' };
  } catch (err) { console.error(err); }
  res.redirect('/admin');
});

module.exports = router;
