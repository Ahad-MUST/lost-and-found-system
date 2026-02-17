// routes/profile.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const { requireLogin } = require('../middleware/auth');

// GET /profile
router.get('/', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  try {
    const [rows] = await pool.execute('SELECT UserID, Name, Email, Phone, Role, CreatedAt FROM Users WHERE UserID = ?', [userID]);
    if (!rows.length) return res.redirect('/logout');
    const [[{ lostCount }]]      = await pool.execute('SELECT COUNT(*) AS lostCount  FROM Lost_Items  WHERE UserID = ?', [userID]);
    const [[{ foundCount }]]     = await pool.execute('SELECT COUNT(*) AS foundCount FROM Found_Items WHERE UserID = ?', [userID]);
    const [[{ recoveredCount }]] = await pool.execute('SELECT COUNT(*) AS recoveredCount FROM Lost_Items WHERE UserID = ? AND Status = "Recovered"', [userID]);
    res.render('profile', {
      profile: rows[0],
      stats: { lostCount, foundCount, recoveredCount },
      flash: res.locals.flash,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.render('profile', { profile: req.session.user, stats: { lostCount: 0, foundCount: 0, recoveredCount: 0 }, flash: null, error: 'Could not load profile.' });
  }
});

// POST /profile/update — update name and phone
router.post('/update', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { name, phone } = req.body;
  if (!name || name.trim().length < 2) {
    const [rows] = await pool.execute('SELECT UserID, Name, Email, Phone, Role, CreatedAt FROM Users WHERE UserID = ?', [userID]);
    const [[{ lostCount }]]  = await pool.execute('SELECT COUNT(*) AS lostCount FROM Lost_Items WHERE UserID = ?', [userID]);
    const [[{ foundCount }]] = await pool.execute('SELECT COUNT(*) AS foundCount FROM Found_Items WHERE UserID = ?', [userID]);
    const [[{ recoveredCount }]] = await pool.execute('SELECT COUNT(*) AS recoveredCount FROM Lost_Items WHERE UserID = ? AND Status = "Recovered"', [userID]);
    return res.render('profile', { profile: rows[0], stats: { lostCount, foundCount, recoveredCount }, flash: null, error: 'Name must be at least 2 characters.' });
  }
  try {
    await pool.execute('UPDATE Users SET Name = ?, Phone = ? WHERE UserID = ?', [name.trim(), phone || null, userID]);
    req.session.user.Name = name.trim();
    req.session.flash = { type: 'success', msg: 'Profile updated successfully.' };
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'error', msg: 'Update failed. Please try again.' };
    res.redirect('/profile');
  }
});

// POST /profile/change-password
router.post('/change-password', requireLogin, async (req, res) => {
  const pool   = req.app.locals.pool;
  const userID = req.session.user.UserID;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const [rows] = await pool.execute('SELECT Password FROM Users WHERE UserID = ?', [userID]);
  const match  = await bcrypt.compare(currentPassword, rows[0].Password);
  if (!match) {
    req.session.flash = { type: 'error', msg: 'Current password is incorrect.' };
    return res.redirect('/profile');
  }
  if (!newPassword || newPassword.length < 6) {
    req.session.flash = { type: 'error', msg: 'New password must be at least 6 characters.' };
    return res.redirect('/profile');
  }
  if (newPassword !== confirmPassword) {
    req.session.flash = { type: 'error', msg: 'New passwords do not match.' };
    return res.redirect('/profile');
  }
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE Users SET Password = ? WHERE UserID = ?', [hashed, userID]);
    req.session.flash = { type: 'success', msg: 'Password changed successfully.' };
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'error', msg: 'Password change failed.' };
    res.redirect('/profile');
  }
});

module.exports = router;
