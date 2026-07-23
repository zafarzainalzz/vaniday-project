const express = require("express");
const Booking = require("../models/Booking");
const Merchant = require("../models/Merchant");
const Service = require("../models/Service");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

function timeToMinutes(timeValue) {
    var hour = Number(timeValue.substring(0, 2));
    var minute = Number(timeValue.substring(3, 5));
    return hour * 60 + minute;
}

async function hasTimeConflict(merchantId, bookingDate, bookingTime, excludeBookingId) {
    var newMinutes = timeToMinutes(bookingTime);
    var query = {
        merchant: merchantId,
        bookingDate: bookingDate,
        status: { $ne: "Cancelled" }
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    var existingBookings = await Booking.find(query);

    for (var i = 0; i < existingBookings.length; i = i + 1) {
        var existingMinutes = timeToMinutes(existingBookings[i].bookingTime);
        var gap = Math.abs(newMinutes - existingMinutes);

        if (gap < 60) {
            return true;
        }
    }

    return false;
}

// POST /api/bookings - Create a booking (authenticated)
router.post("/", authenticate, async function (req, res) {
    try {
        const { merchant, service, bookingDate, bookingTime } = req.body;

        if (!merchant || !service || !bookingDate || !bookingTime) {
            return res.status(400).json({ message: "Merchant, service, booking date, and booking time are required." });
        }

        const merchantDoc = await Merchant.findById(merchant);

        if (!merchantDoc || !merchantDoc.active) {
            return res.status(404).json({ message: "Merchant not found or inactive." });
        }

        const serviceDoc = await Service.findById(service);

        if (!serviceDoc || !serviceDoc.active) {
            return res.status(404).json({ message: "Service not found or inactive." });
        }

        if (serviceDoc.merchant.toString() !== merchant) {
            return res.status(400).json({ message: "Service does not belong to the selected merchant." });
        }

        const conflict = await hasTimeConflict(merchant, bookingDate, bookingTime, null);

        if (conflict) {
            return res.status(409).json({ message: "Time conflict: another active booking exists within 1 hour of this slot." });
        }

        const booking = new Booking({
            customer: req.user.id,
            merchant: merchant,
            service: service,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            status: "Confirmed"
        });

        await booking.save();

        const populated = await Booking.findById(booking._id)
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price");

        res.status(201).json({
            message: "Booking created successfully.",
            booking: populated
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create booking." });
    }
});

// GET /api/bookings/mine - Get logged-in customer's bookings
router.get("/mine", authenticate, async function (req, res) {
    try {
        const bookings = await Booking.find({ customer: req.user.id, status: { $ne: "Cancelled" } })
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price")
            .sort({ bookingDate: -1, bookingTime: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get your bookings." });
    }
});

// GET /api/bookings/owner - Get shop owner's bookings (all bookings for their merchants)
router.get("/owner", authenticate, requireRole("Shop Owner", "Admin"), async function (req, res) {
    try {
        var merchantQuery = { owner: req.user.id };

        if (req.user.role === "Admin") {
            merchantQuery = {};
        }

        const ownedMerchants = await Merchant.find(merchantQuery).select("_id");
        const merchantIds = ownedMerchants.map(function (m) { return m._id; });

        const bookings = await Booking.find({ merchant: { $in: merchantIds }, status: { $ne: "Cancelled" } })
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price")
            .sort({ bookingDate: -1, bookingTime: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get owner bookings." });
    }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put("/:id/cancel", authenticate, async function (req, res) {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled." });
        }

        var isCustomer = booking.customer.toString() === req.user.id;
        var isOwner = false;

        if (!isCustomer) {
            const merchant = await Merchant.findById(booking.merchant);

            if (merchant && merchant.owner.toString() === req.user.id) {
                isOwner = true;
            }
        }

        if (!isCustomer && !isOwner && req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied. You can only cancel your own bookings." });
        }

        booking.status = "Cancelled";
        await booking.save();

        res.status(200).json({ message: "Booking cancelled successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to cancel booking." });
    }
});

// PUT /api/bookings/:id/status - Update booking status (shop owner or admin)
router.put("/:id/status", authenticate, requireRole("Shop Owner", "Admin"), async function (req, res) {
    try {
        const { status } = req.body;

        if (!status || ["Pending", "Confirmed", "Cancelled"].indexOf(status) === -1) {
            return res.status(400).json({ message: "Valid status required: Pending, Confirmed, or Cancelled." });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const merchant = await Merchant.findById(booking.merchant);

        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        if (req.user.role !== "Admin" && merchant.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only update bookings for your own merchant." });
        }

        booking.status = status;
        await booking.save();

        const updated = await Booking.findById(booking._id)
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price");

        res.status(200).json({
            message: "Booking status updated.",
            booking: updated
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update booking status." });
    }
});

module.exports = router;
