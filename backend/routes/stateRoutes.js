const express = require('express');
const AppState = require('../models/AppState');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

async function readScope(scope) {
  const state = await AppState.findOne({ scope }).lean();
  return state && state.values ? state.values : {};
}
async function patchScope(scope, key, value) {
  const update = { $set: {} }; update.$set['values.' + key] = value;
  const state = await AppState.findOneAndUpdate({ scope }, update, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
  return state.values || {};
}
async function removeScopeKey(scope, key) {
  const update = { $unset: {} }; update.$unset['values.' + key] = '';
  const state = await AppState.findOneAndUpdate({ scope }, update, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
  return state.values || {};
}

router.get('/global', async function (req, res) { res.json({ values: await readScope('global') }); });
router.patch('/global', authenticate, requireRole('Shop Owner', 'Merchant Admin'), async function (req, res) {
  const key = String(req.body.key || ''); if (!key) return res.status(400).json({ message: 'State key is required.' });
  res.json({ values: await patchScope('global', key, req.body.value) });
});
router.delete('/global/:key', authenticate, requireRole('Merchant Admin'), async function (req, res) {
  res.json({ values: await removeScopeKey('global', req.params.key) });
});
router.get('/user/:userId', authenticate, async function (req, res) {
  if (req.user.id !== req.params.userId && req.user.role !== 'Merchant Admin') return res.status(403).json({ message: 'Access denied.' });
  res.json({ values: await readScope('user:' + req.params.userId) });
});
router.patch('/user/:userId', authenticate, async function (req, res) {
  if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Access denied.' });
  const key = String(req.body.key || ''); if (!key) return res.status(400).json({ message: 'State key is required.' });
  res.json({ values: await patchScope('user:' + req.params.userId, key, req.body.value) });
});
router.delete('/user/:userId/:key', authenticate, async function (req, res) {
  if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Access denied.' });
  res.json({ values: await removeScopeKey('user:' + req.params.userId, req.params.key) });
});
router.post('/user/:userId/import', authenticate, async function (req, res) {
  if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Access denied.' });
  const incoming = req.body.values && typeof req.body.values === 'object' ? req.body.values : {};
  delete incoming.allBookings;
  delete incoming.vanidayLoyaltyPoints;
  const state = await AppState.findOneAndUpdate({ scope: 'user:' + req.params.userId }, { $set: { values: incoming } }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
  res.json({ values: state.values || {} });
});
module.exports = router;
