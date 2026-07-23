const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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

    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Cancelled"],
        default: "Pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Booking", bookingSchema);
