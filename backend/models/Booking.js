const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    serviceName: String,
    bookingDate: String,
    bookingTime: String,
    status: String
});

module.exports = mongoose.model("Booking", bookingSchema);