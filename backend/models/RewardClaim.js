const mongoose = require('mongoose');

const rewardClaimSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rewardName: { type: String, required: true },
  pointsUsed: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Claimed', 'Used', 'Cancelled'], default: 'Claimed' }
}, { timestamps: true });

module.exports = mongoose.model('RewardClaim', rewardClaimSchema);
