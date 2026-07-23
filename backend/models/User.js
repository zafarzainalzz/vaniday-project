const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["Customer", "Shop Owner", "Admin"],
        default: "Customer"
    },

    loyaltyPoints: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("User", userSchema);
