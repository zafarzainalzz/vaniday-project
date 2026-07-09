const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// Signup route
router.post("/signup", async function (req, res) {
    try {
        const { fullName, email, password, role } = req.body;

        // Check if email already exists in MongoDB
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(400).send("Email already exists. Please use another email.");
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
            role: role
        });

        // saves user into MongoDB
        await newUser.save();

        // Redirect to login page after successful signup
        res.status(201).json({
            message: "Signup successful."
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Signup failed.");
    }
});

// Login route
router.post("/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        // Find user by email in MongoDB
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Compare entered password with hashed password stored in MongoDB
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).send("Incorrect password.");
        }

        // Redirect to dashboard after successful login
        res.status(200).json({
            message: "Login successful.",
            userId: user._id,
            fullName: user.fullName,
            role: user.role,
            loyaltyPoints: user.loyaltyPoints
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Login failed.");
    }
});

// GET /api/users/:id/points - Get user's loyalty points
router.get("/:id/points", async function (req, res) {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.status(200).json({
            userId: user._id,
            loyaltyPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Failed to get points.");
    }
});

// POST /api/users/points/add - Add loyalty points to a user (by email or userId)
router.post("/points/add", async function (req, res) {
    try {
        const { email, userId, points } = req.body;

        if ((!email && !userId) || points == null) {
            return res.status(400).send("Email or userId and points are required.");
        }

        var user;

        if (userId) {
            user = await User.findById(userId);
        } else {
            user = await User.findOne({ email: email });
        }

        if (!user) {
            return res.status(404).send("User not found.");
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
        res.status(500).send("Failed to add points.");
    }
});

// POST /api/users/points/deduct - Deduct loyalty points from a user (by email or userId)
router.post("/points/deduct", async function (req, res) {
    try {
        const { email, userId, points } = req.body;

        if ((!email && !userId) || points == null) {
            return res.status(400).send("Email or userId and points are required.");
        }

        var user;

        if (userId) {
            user = await User.findById(userId);
        } else {
            user = await User.findOne({ email: email });
        }

        if (!user) {
            return res.status(404).send("User not found.");
        }

        if (user.loyaltyPoints == null) {
            user.loyaltyPoints = 0;
        }

        if (user.loyaltyPoints < Number(points)) {
            return res.status(400).send("Insufficient points.");
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
        res.status(500).send("Failed to deduct points.");
    }
});

module.exports = router;
