const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    description: {
        type: String,
        default: ""
    },

    address: {
        type: String,
        default: ""
    },

    phone: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    available: {
        type: String,
        default: ""
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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

module.exports = mongoose.model("Merchant", merchantSchema);
