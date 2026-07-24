const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    customerName: {
        type: String,
        default: ""
    },

    customerEmail: {
        type: String,
        default: ""
    },

    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Merchant",
        required: true
    },

    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },

    bookingDate: {
        type: String,
        required: true
    },

    bookingTime: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        default: 100
    },

    reward: {
        type: String,
        default: ""
    },

    loyaltyAwarded: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
        default: "Pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
