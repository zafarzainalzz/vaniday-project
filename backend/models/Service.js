const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Merchant",
        required: true
    },

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true
    },

    duration: {
        type: Number,
        default: 60
    },

    active: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Service", serviceSchema);
