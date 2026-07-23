const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken, authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// Signup route - public, always creates Customer accounts only
router.post("/signup", async function (req, res) {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Full name, email, and password are required." });
        }

        // Check if email already exists in MongoDB
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists. Please use another email." });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Always create as Customer - public signup cannot create Admin or Shop Owner
        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
            role: "Customer"
        });

        // saves user into MongoDB
        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({
            message: "Signup successful.",
            token: token,
            userId: newUser._id,
            fullName: newUser.fullName,
            role: newUser.role
        });

    } catch (error) {
        console.log("Signup error:", error.message);
        console.log(error.stack);
        res.status(500).json({ message: "Signup failed: " + error.message });
    }
});

// Login route - public, returns JWT
router.post("/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Find user by email in MongoDB
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Compare entered password with hashed password stored in MongoDB
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        const token = generateToken(user);

        // Redirect to dashboard after successful login
        res.status(200).json({
            message: "Login successful.",
            token: token,
            userId: user._id,
            fullName: user.fullName,
            role: user.role,
            loyaltyPoints: user.loyaltyPoints
        });

    } catch (error) {
        console.log("Login error:", error.message);
        console.log(error.stack);
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

        res.status(200).json({
            userId: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            loyaltyPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get user profile." });
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
        console.log(error);
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
        console.log(error);
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
        console.log(error);
        res.status(500).json({ message: "Failed to deduct points." });
    }
});

module.exports = router;
