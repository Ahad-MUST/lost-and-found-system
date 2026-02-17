/* public/js/validation.js — Client-side validation for all forms */

function showError(id, msg) { const el = document.getElementById(id); if (el) { el.textContent = msg; } }
function clearError(id)     { const el = document.getElementById(id); if (el) { el.textContent = ''; } }
function markInvalid(id)    { const el = document.getElementById(id); if (el) el.style.borderColor = '#dc2626'; }
function markValid(id)      { const el = document.getElementById(id); if (el) el.style.borderColor = ''; }

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isNotFuture(d)  { return d && new Date(d) <= new Date(); }

// ── LOGIN ──────────────────────────────────────────────────────────────────
(function () {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    let ok = true;
    clearError('emailError');    markValid('email');
    clearError('passwordError'); markValid('password');
    const email    = document.getElementById('email');
    const password = document.getElementById('password');
    if (!email.value.trim()) { showError('emailError', 'Email is required.'); markInvalid('email'); ok = false; }
    else if (!isValidEmail(email.value.trim())) { showError('emailError', 'Enter a valid email.'); markInvalid('email'); ok = false; }
    if (!password.value) { showError('passwordError', 'Password is required.'); markInvalid('password'); ok = false; }
    if (!ok) e.preventDefault();
  });
})();

// ── REGISTER ───────────────────────────────────────────────────────────────
(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    let ok = true;
    ['nameError','emailError','passwordError','confirmError'].forEach(clearError);
    ['name','email','password','confirm'].forEach(markValid);
    const name     = document.getElementById('name');
    const email    = document.getElementById('email');
    const password = document.getElementById('password');
    const confirm  = document.getElementById('confirm');
    const phone    = document.getElementById('phone');
    if (!name.value.trim() || name.value.trim().length < 2) { showError('nameError', 'Name must be at least 2 characters.'); markInvalid('name'); ok = false; }
    if (!email.value.trim()) { showError('emailError', 'Email is required.'); markInvalid('email'); ok = false; }
    else if (!isValidEmail(email.value.trim())) { showError('emailError', 'Enter a valid email address.'); markInvalid('email'); ok = false; }
    if (!password.value || password.value.length < 6) { showError('passwordError', 'Password must be at least 6 characters.'); markInvalid('password'); ok = false; }
    if (!confirm.value) { showError('confirmError', 'Please confirm your password.'); markInvalid('confirm'); ok = false; }
    else if (confirm.value !== password.value) { showError('confirmError', 'Passwords do not match.'); markInvalid('confirm'); ok = false; }
    if (phone && phone.value.trim() && !/^[0-9+\-\s()]{7,15}$/.test(phone.value.trim())) {
      // non-blocking warning
    }
    if (!ok) e.preventDefault();
  });
})();

// ── LOST ITEM ──────────────────────────────────────────────────────────────
(function () {
  const form = document.getElementById('lostItemForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    let ok = true;
    ['itemNameError','categoryError','dateLostError','locationLostError','descriptionError'].forEach(clearError);
    ['itemName','category','dateLost','locationLost','description'].forEach(markValid);
    const itemName     = document.getElementById('itemName');
    const category     = document.getElementById('category');
    const dateLost     = document.getElementById('dateLost');
    const locationLost = document.getElementById('locationLost');
    const description  = document.getElementById('description');
    if (!itemName.value.trim()) { showError('itemNameError', 'Item name is required.'); markInvalid('itemName'); ok = false; }
    if (!category.value) { showError('categoryError', 'Please select a category.'); markInvalid('category'); ok = false; }
    if (!dateLost.value) { showError('dateLostError', 'Date lost is required.'); markInvalid('dateLost'); ok = false; }
    else if (!isNotFuture(dateLost.value)) { showError('dateLostError', 'Date cannot be in the future.'); markInvalid('dateLost'); ok = false; }
    if (!locationLost.value.trim()) { showError('locationLostError', 'Location is required.'); markInvalid('locationLost'); ok = false; }
    if (!description.value.trim() || description.value.trim().length < 10) { showError('descriptionError', 'Description must be at least 10 characters.'); markInvalid('description'); ok = false; }
    if (!ok) e.preventDefault();
  });
})();

// ── FOUND ITEM ─────────────────────────────────────────────────────────────
(function () {
  const form = document.getElementById('foundItemForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    let ok = true;
    ['itemNameError','categoryError','dateFoundError','locationFoundError','descriptionError'].forEach(clearError);
    ['itemName','category','dateFound','locationFound','description'].forEach(markValid);
    const itemName      = document.getElementById('itemName');
    const category      = document.getElementById('category');
    const dateFound     = document.getElementById('dateFound');
    const locationFound = document.getElementById('locationFound');
    const description   = document.getElementById('description');
    if (!itemName.value.trim()) { showError('itemNameError', 'Item name is required.'); markInvalid('itemName'); ok = false; }
    if (!category.value) { showError('categoryError', 'Please select a category.'); markInvalid('category'); ok = false; }
    if (!dateFound.value) { showError('dateFoundError', 'Date found is required.'); markInvalid('dateFound'); ok = false; }
    else if (!isNotFuture(dateFound.value)) { showError('dateFoundError', 'Date cannot be in the future.'); markInvalid('dateFound'); ok = false; }
    if (!locationFound.value.trim()) { showError('locationFoundError', 'Location is required.'); markInvalid('locationFound'); ok = false; }
    if (!description.value.trim() || description.value.trim().length < 10) { showError('descriptionError', 'Description must be at least 10 characters.'); markInvalid('description'); ok = false; }
    if (!ok) e.preventDefault();
  });
})();

// ── PROFILE UPDATE ─────────────────────────────────────────────────────────
(function () {
  const form = document.getElementById('profileForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    let ok = true;
    clearError('nameError'); markValid('name');
    const name  = document.getElementById('name');
    const phone = document.getElementById('phone');
    if (!name.value.trim() || name.value.trim().length < 2) { showError('nameError', 'Name must be at least 2 characters.'); markInvalid('name'); ok = false; }
    if (phone && phone.value.trim() && !/^[0-9+\-\s()]{7,15}$/.test(phone.value.trim())) {
      showError('phoneError', 'Enter a valid phone number.'); markInvalid('phone'); ok = false;
    }
    if (!ok) e.preventDefault();
  });
})();

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
(function () {
  const form = document.getElementById('passwordForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    let ok = true;
    ['currentPasswordError','newPasswordError','confirmPasswordError'].forEach(clearError);
    ['currentPassword','newPassword','confirmPassword'].forEach(markValid);
    const cur     = document.getElementById('currentPassword');
    const newP    = document.getElementById('newPassword');
    const confirm = document.getElementById('confirmPassword');
    if (!cur.value)  { showError('currentPasswordError', 'Current password is required.'); markInvalid('currentPassword'); ok = false; }
    if (!newP.value || newP.value.length < 6) { showError('newPasswordError', 'New password must be at least 6 characters.'); markInvalid('newPassword'); ok = false; }
    if (!confirm.value) { showError('confirmPasswordError', 'Please confirm new password.'); markInvalid('confirmPassword'); ok = false; }
    else if (confirm.value !== newP.value) { showError('confirmPasswordError', 'Passwords do not match.'); markInvalid('confirmPassword'); ok = false; }
    if (!ok) e.preventDefault();
  });
})();
