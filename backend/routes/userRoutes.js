const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const RewardClaim = require("../models/RewardClaim");
const { generateToken, authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// Signup route - public, always creates Customer accounts only
router.post("/signup", async function (req, res) {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Full name, email, and password are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must contain at least 6 characters." });
        }

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists. Please use another email." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
            role: "Customer",
            loyaltyPoints: 100
        });

        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({
            message: "Signup successful.",
            token: token,
            userId: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            loyaltyPoints: newUser.loyaltyPoints
        });

    } catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).json({ message: "Signup failed: " + error.message });
    }
});

function normalizeRole(role) {
    if (role === "Shop Owner") return "Shop Owner";
    if (role === "Merchant Admin" || role === "Admin") return "Merchant Admin";
    return "Customer";
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Login route - public, supports name/email/username login with optional role selector
router.post("/login", async function (req, res) {
    try {
        var identifier = String(req.body.identifier || req.body.email || req.body.username || "").trim();
        var password = String(req.body.password || "");
        var selectedRole = normalizeRole(req.body.role);

        if (!identifier || !password) {
            return res.status(400).json({ message: "Name/email and password are required." });
        }

        var lower = identifier.toLowerCase();
        var users = await User.find({
            $or: [
                { email: lower },
                { username: lower },
                { fullName: new RegExp("^" + escapeRegex(identifier) + "$", "i") }
            ]
        }).limit(3);

        if (users.length === 0) {
            return res.status(404).json({ message: "Account not found." });
        }

        if (users.length > 1) {
            var matched = [];
            for (var i = 0; i < users.length; i++) {
                if (await bcrypt.compare(password, users[i].password)) {
                    matched.push(users[i]);
                }
            }
            users = matched;
        }

        var user = users.length === 1 ? users[0] : null;

        if (!user) {
            return res.status(401).json({
                message: users.length > 1
                    ? "More than one customer has this name. Please use your email."
                    : "Incorrect password."
            });
        }

        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        if (req.body.role && selectedRole !== normalizeRole(user.role)) {
            return res.status(403).json({ message: "Please select the correct account type." });
        }

        var token = generateToken(user);

        res.status(200).json({
            message: "Login successful.",
            token: token,
            userId: user._id,
            fullName: user.fullName,
            email: user.email,
            username: user.username || "",
            role: normalizeRole(user.role),
            loyaltyPoints: user.loyaltyPoints || 0
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Login failed: " + error.message });
    }
});

// GET /api/users/me - protected route, returns current user profile
router.get("/me", authenticate, async function (req, res) {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get user profile." });
    }
});

// GET /api/users/me/points - Get current user's loyalty points (protected)
router.get("/me/points", authenticate, async function (req, res) {
    try {
        const user = await User.findById(req.user.id).select("loyaltyPoints");
        res.json({ loyaltyPoints: user ? user.loyaltyPoints || 0 : 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get points." });
    }
});

// GET /api/users/:id/points - Get user's loyalty points (protected)
router.get("/:id/points", authenticate, async function (req, res) {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({
            userId: user._id,
            loyaltyPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get points." });
    }
});

// POST /api/users/points/add - Add loyalty points to a user (protected)
router.post("/points/add", authenticate, async function (req, res) {
    try {
        const { email, userId, points } = req.body;

        if ((!email && !userId) || points == null) {
            return res.status(400).json({ message: "Email or userId and points are required." });
        }

        var user;

        if (userId) {
            user = await User.findById(userId);
        } else {
            user = await User.findOne({ email: email });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.loyaltyPoints == null) {
            user.loyaltyPoints = 0;
        }

        user.loyaltyPoints += Number(points);
        await user.save();

        res.status(200).json({
            message: "Points added successfully.",
            userId: user._id,
            loyaltyPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add points." });
    }
});

// POST /api/users/points/deduct - Deduct loyalty points from a user (protected)
router.post("/points/deduct", authenticate, async function (req, res) {
    try {
        const { email, userId, points } = req.body;

        if ((!email && !userId) || points == null) {
            return res.status(400).json({ message: "Email or userId and points are required." });
        }

        var user;

        if (userId) {
            user = await User.findById(userId);
        } else {
            user = await User.findOne({ email: email });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.loyaltyPoints == null) {
            user.loyaltyPoints = 0;
        }

        if (user.loyaltyPoints < Number(points)) {
            return res.status(400).json({ message: "Insufficient points." });
        }

        user.loyaltyPoints -= Number(points);
        await user.save();

        res.status(200).json({
            message: "Points deducted successfully.",
            userId: user._id,
            loyaltyPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to deduct points." });
    }
});

// POST /api/users/me/rewards/claim - Claim a reward (deducts points server-side)
router.post("/me/rewards/claim", authenticate, async function (req, res) {
    try {
        const requestedRewardName = String(req.body.rewardName || "").trim();

        // Server-controlled reward catalogue prevents customers from changing
        // the points cost in the browser before submitting a claim.
        const rewardCatalogue = {
            "Free Appointment at Manly Mane Salon": 500,
            "Free Yoga Session at The Wellness Centre": 600,
            "25% off next appointment": 1000,
            "Free Glow Add-on": 500,
            "5% off next booking": 500,
            "Free Premium Hair Treatment": 1000,
            "$20 Vaniday Voucher": 2500,
            "Free Spa Session": 5000,
            "$100 NTUC Voucher": 10000,
            "Business Class Upgrade Voucher": 20000,
            "Vaniday VIP Gold Membership": 50000
        };

        if (!Object.prototype.hasOwnProperty.call(rewardCatalogue, requestedRewardName)) {
            return res.status(400).json({ message: "Invalid reward selected." });
        }

        const rewardName = requestedRewardName;
        const points = rewardCatalogue[rewardName];

        const user = await User.findOneAndUpdate(
            { _id: req.user.id, loyaltyPoints: { $gte: points } },
            { $inc: { loyaltyPoints: -points } },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ message: "Insufficient points." });
        }

        const claim = await RewardClaim.create({ customerId: user._id, rewardName: rewardName, pointsUsed: points });
        res.status(201).json({ message: "Reward claimed.", loyaltyPoints: user.loyaltyPoints, claim: claim });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to claim reward." });
    }
});

// GET /api/users/me/rewards - Get current user's reward claims
router.get("/me/rewards", authenticate, async function (req, res) {
    try {
        const claims = await RewardClaim.find({ customerId: req.user.id }).sort({ createdAt: -1 });
        res.json(claims);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get rewards." });
    }
});

module.exports = router;
