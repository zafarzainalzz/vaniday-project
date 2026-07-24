// DEPRECATED: This model is kept only for the migration script (migrateShops.js).
// The Merchant model is the single source of truth for shop information.
// After running the migration, this file can be deleted along with migrateShops.js.
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: { type: String, default: '' },
  days: { type: String, default: '' },
  assignedShop: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
