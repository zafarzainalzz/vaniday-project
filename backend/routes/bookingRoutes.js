const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

router.post("/", function (req, res) {
  const booking = new Booking({
    customerName: req.body.customerName,
    merchant: req.body.merchant,
    service: req.body.service,
    bookingDate: req.body.bookingDate,
    bookingTime: req.body.bookingTime,
    status: "Pending"
  });

  booking.save()
    .then(function (savedBooking) {
      res.json(savedBooking);
    })
    .catch(function (error) {
      res.status(500).json(error);
    });
});

router.get("/", function (req, res) {
  Booking.find()
    .then(function (bookings) {
      res.json(bookings);
    })
    .catch(function (error) {
      res.status(500).json(error);
    });
});

module.exports = router;