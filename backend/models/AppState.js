const mongoose = require("mongoose");

const appStateSchema = new mongoose.Schema({
  scope: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  values: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true, minimize: false });

module.exports = mongoose.model("AppState", appStateSchema);
