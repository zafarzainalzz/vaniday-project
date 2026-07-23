const express = require('express');
const Shop = require('../models/Shop');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/me', authenticate, requireRole('Shop Owner'), async function (req, res) {
  res.json(await Shop.findOne({ ownerId: req.user.id }) || {});
});
router.put('/me', authenticate, requireRole('Shop Owner'), async function (req, res) {
  const shop = await Shop.findOneAndUpdate(
    { ownerId: req.user.id },
    { ownerId: req.user.id, name: req.body.name, location: req.body.location || '', days: req.body.days || '', assignedShop: req.body.assignedShop || '' },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(shop);
});
module.exports = router;
