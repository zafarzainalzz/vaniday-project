const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: { type: String, default: '' },
  days: { type: String, default: '' },
  assignedShop: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
