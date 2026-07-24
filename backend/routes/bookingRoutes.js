const express = require("express");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Merchant = require("../models/Merchant");
const Service = require("../models/Service");
const { authenticate, optionalAuthenticate, requireRole } = require("../middleware/auth");

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

// POST /api/bookings - Create a booking (supports both logged-in users and guests)
router.post("/", optionalAuthenticate, async function (req, res) {
    try {
        if (req.user && req.user.role !== "Customer") {
            return res.status(403).json({ message: "Only customers or guests can create bookings." });
        }

        var merchant = String(req.body.merchant || "").trim();
        var service = String(req.body.service || "").trim();
        var bookingDate = String(req.body.bookingDate || "").trim();
        var bookingTime = String(req.body.bookingTime || "").trim();

        if (!merchant || !service || !bookingDate || !bookingTime) {
            return res.status(400).json({ message: "Merchant, service, date and time are required." });
        }

        var merchantDoc = await Merchant.findById(merchant);
        if (!merchantDoc || !merchantDoc.active) {
            return res.status(404).json({ message: "Merchant not found or inactive." });
        }

        var serviceDoc = await Service.findById(service);
        if (!serviceDoc || !serviceDoc.active) {
            return res.status(404).json({ message: "Service not found or inactive." });
        }

        if (serviceDoc.merchant.toString() !== merchant) {
            return res.status(400).json({ message: "Service does not belong to the selected merchant." });
        }

        if (await hasTimeConflict(merchant, bookingDate, bookingTime, null)) {
            return res.status(409).json({ message: "That timing is taken. Please choose another time." });
        }

        var user = null;
        var guestToken = "";
        var customerName = String(req.body.customerName || "").trim();
        var customerEmail = String(req.body.customerEmail || "").trim().toLowerCase();

        if (req.user) {
            user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ message: "Customer account not found." });
            customerName = user.fullName;
            customerEmail = user.email;
        } else {
            if (!customerName) {
                return res.status(400).json({ message: "Customer name is required for guest booking." });
            }
            guestToken = crypto.randomBytes(24).toString("hex");
        }

        var booking = new Booking({
            customer: user ? user._id : undefined,
            customerName: customerName,
            customerEmail: customerEmail,
            guestToken: guestToken,
            merchant: merchant,
            service: service,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            amount: serviceDoc.price,
            reward: user ? String(req.body.reward || "").trim() : "",
            loyaltyAwarded: !!user,
            status: "Confirmed"
        });

        await booking.save();

        var loyaltyPoints = null;
        if (user) {
            user.loyaltyPoints = (user.loyaltyPoints || 0) + 100;
            await user.save();
            loyaltyPoints = user.loyaltyPoints;
        }

        var populated = await Booking.findById(booking._id)
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price");

        res.status(201).json({
            message: "Booking created successfully.",
            booking: populated,
            loyaltyPoints: loyaltyPoints,
            guestToken: guestToken || undefined,
            isGuest: !user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create booking." });
    }
});

// GET /api/bookings/guest - Get guest bookings via X-Guest-Token header
router.get("/guest", async function (req, res) {
    try {
        var token = String(req.headers["x-guest-token"] || req.query.token || "").trim();
        if (!token) {
            return res.status(401).json({ message: "Guest booking access token required." });
        }

        var bookings = await Booking.find({ guestToken: token })
            .select("+guestToken")
            .populate("merchant", "name")
            .populate("service", "name price")
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get guest bookings." });
    }
});

// GET /api/bookings/mine - Get logged-in customer's bookings
router.get("/mine", authenticate, async function (req, res) {
    try {
        var bookings = await Booking.find({ customer: req.user.id, status: { $ne: "Cancelled" } })
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

// GET /api/bookings - Get bookings (filtered by role)
router.get("/", authenticate, async function (req, res) {
    try {
        var filter = req.user.role === "Customer" ? { customer: req.user.id } : {};
        var bookings = await Booking.find(filter)
            .populate("customer", "fullName email")
            .populate("merchant", "name")
            .populate("service", "name price")
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get bookings." });
    }
});

// GET /api/bookings/owner - Get shop owner's bookings
router.get("/owner", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        var merchantQuery = { owner: req.user.id };

        if (req.user.role === "Merchant Admin") {
            merchantQuery = {};
        }

        var ownedMerchants = await Merchant.find(merchantQuery).select("_id");
        var merchantIds = ownedMerchants.map(function (m) { return m._id; });

        var bookings = await Booking.find({ merchant: { $in: merchantIds }, status: { $ne: "Cancelled" } })
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
        var booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled." });
        }

        var isCustomer = booking.customer && booking.customer.toString() === req.user.id;
        var isOwner = false;

        if (!isCustomer) {
            var merchantDoc = await Merchant.findById(booking.merchant);
            if (merchantDoc && merchantDoc.owner.toString() === req.user.id) {
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
        var status = String(req.body.status || "").trim();
        var allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

        if (!status || allowedStatuses.indexOf(status) === -1) {
            return res.status(400).json({ message: "Valid status required: Pending, Confirmed, Completed, or Cancelled." });
        }

        var booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        var merchantDoc = await Merchant.findById(booking.merchant);

        if (!merchantDoc) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        if (req.user.role !== "Merchant Admin" && merchantDoc.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only update bookings for your own merchant." });
        }

        booking.status = status;
        await booking.save();

        var updated = await Booking.findById(booking._id)
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
        var booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        var isCustomer = booking.customer && booking.customer.toString() === req.user.id;

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
        var result = await Booking.deleteMany({});
        res.status(200).json({ message: "All bookings cleared.", deletedCount: result.deletedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to clear bookings." });
    }
});

module.exports = router;
