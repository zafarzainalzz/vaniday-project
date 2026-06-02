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

        // Save user into MongoDB
        await newUser.save();

        // Redirect to login page after successful signup
        res.redirect("http://localhost:5500/login.html");

    } catch (error) {
        console.log(error);
        res.status(500).send("Signup failed.");
    }
});

module.exports = router;
