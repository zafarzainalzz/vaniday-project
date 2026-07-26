const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },

    customerName: {
        type: String,
        required: true
    },

    customerEmail: {
        type: String,
        default: ""
    },

    guestToken: {
        type: String,
        default: "",
        index: true,
        select: false
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

    bookingSource: {
        type: String,
        enum: ["Website", "QR Code"],
        default: "Website"
    },

    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
        default: "Pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
