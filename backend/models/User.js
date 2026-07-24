const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    username: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        unique: true,
        index: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["Customer", "Shop Owner", "Merchant Admin"],
        default: "Customer"
    },

    loyaltyPoints: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
