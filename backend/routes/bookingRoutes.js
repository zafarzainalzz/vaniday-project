const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
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

        const customer = await User.findById(req.user.id);

        const booking = new Booking({
            customer: req.user.id,
            customerName: customer ? customer.fullName : "",
            customerEmail: customer ? customer.email : "",
            merchant: merchant,
            service: service,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            amount: Number(req.body.amount) || 100,
            reward: req.body.reward || "",
            loyaltyAwarded: true,
            status: "Confirmed"
        });

        await booking.save();

        if (customer) {
            customer.loyaltyPoints = (customer.loyaltyPoints || 0) + 100;
            await customer.save();
        }

        const populated = await Booking.findById(booking._id)
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price");

        res.status(201).json({
            message: "Booking created successfully.",
            booking: populated,
            loyaltyPoints: customer ? customer.loyaltyPoints : 0
        });
    } catch (error) {
        console.error(error);
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
        console.error(error);
        res.status(500).json({ message: "Failed to get your bookings." });
    }
});

// GET /api/bookings/owner - Get shop owner's bookings
router.get("/owner", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        var merchantQuery = { owner: req.user.id };

        if (req.user.role === "Merchant Admin") {
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
        console.error(error);
        res.status(500).json({ message: "Failed to get owner bookings." });
    }
});

// PUT /api/bookings/:id/reschedule - Reschedule a booking (customer only)
router.put("/:id/reschedule", authenticate, async function (req, res) {
    try {
        var booking = await Booking.findOne({ _id: req.params.id, customer: req.user.id });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({ message: "A cancelled booking cannot be rescheduled." });
        }

        var merchant = req.body.merchant || booking.merchant;
        var service = req.body.service || booking.service;
        var bookingDate = req.body.bookingDate || booking.bookingDate;
        var bookingTime = req.body.bookingTime || booking.bookingTime;

        var conflict = await Booking.findOne({
            _id: { $ne: booking._id },
            merchant: merchant,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            status: { $ne: "Cancelled" }
        });

        if (conflict) {
            return res.status(409).json({ message: "That timing is taken." });
        }

        booking.merchant = merchant;
        booking.service = service;
        booking.bookingDate = bookingDate;
        booking.bookingTime = bookingTime;
        await booking.save();

        var populated = await Booking.findById(booking._id)
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price");

        res.status(200).json({ message: "Booking rescheduled.", booking: populated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to reschedule booking." });
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

        if (!isCustomer && !isOwner && req.user.role !== "Merchant Admin") {
            return res.status(403).json({ message: "Access denied. You can only cancel your own bookings." });
        }

        booking.status = "Cancelled";
        await booking.save();

        res.status(200).json({ message: "Booking cancelled successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to cancel booking." });
    }
});

// PUT /api/bookings/:id/status - Update booking status (shop owner or admin)
router.put("/:id/status", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        const { status } = req.body;

        if (!status || ["Pending", "Confirmed", "Completed", "Cancelled"].indexOf(status) === -1) {
            return res.status(400).json({ message: "Valid status required: Pending, Confirmed, Completed, or Cancelled." });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const merchant = await Merchant.findById(booking.merchant);

        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        if (req.user.role !== "Merchant Admin" && merchant.owner.toString() !== req.user.id) {
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
        console.error(error);
        res.status(500).json({ message: "Failed to update booking status." });
    }
});

// DELETE /api/bookings/:id - Delete a single booking (customer or admin)
router.delete("/:id", authenticate, async function (req, res) {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        var isCustomer = booking.customer.toString() === req.user.id;

        if (!isCustomer && req.user.role !== "Merchant Admin") {
            return res.status(403).json({ message: "Access denied." });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Booking removed." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete booking." });
    }
});

// DELETE /api/bookings - Clear all bookings (admin only)
router.delete("/", authenticate, requireRole("Merchant Admin"), async function (req, res) {
    try {
        const result = await Booking.deleteMany({});
        res.status(200).json({ message: "All bookings cleared.", deletedCount: result.deletedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to clear bookings." });
    }
});

module.exports = router;
