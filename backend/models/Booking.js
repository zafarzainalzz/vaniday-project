const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },

    merchant: {
        type: String,
        required: true
    },

    service: {
        type: String,
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
