const express = require("express");
const Merchant = require("../models/Merchant");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/merchants/owner/mine - Get current owner's merchants (must be before /:id)
router.get("/owner/mine", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        var query = { owner: req.user.id };

        if (req.user.role === "Merchant Admin") {
            query = {};
        }

        const merchants = await Merchant.find(query).sort({ createdAt: -1 });
        res.status(200).json(merchants);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get merchants." });
    }
});

// POST /api/merchants - Create a merchant (Shop Owner or Admin)
router.post("/", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        const { name, description, address, phone, email, image, available } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Merchant name is required." });
        }

        const existing = await Merchant.findOne({ name: name });

        if (existing) {
            return res.status(400).json({ message: "A merchant with this name already exists." });
        }

        const merchant = new Merchant({
            name: name,
            description: description || "",
            address: address || "",
            phone: phone || "",
            email: email || "",
            image: image || "",
            available: available || "",
            owner: req.user.id
        });

        await merchant.save();

        res.status(201).json({
            message: "Merchant created successfully.",
            merchant: merchant
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create merchant." });
    }
});

// GET /api/merchants - List all active merchants (public)
router.get("/", async function (req, res) {
    try {
        const merchants = await Merchant.find({ active: true }).populate("owner", "fullName email");
        res.status(200).json(merchants);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get merchants." });
    }
});

// GET /api/merchants/:id - Get single merchant (public)
router.get("/:id", async function (req, res) {
    try {
        const merchant = await Merchant.findById(req.params.id).populate("owner", "fullName email");

        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        res.status(200).json(merchant);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get merchant." });
    }
});

// PUT /api/merchants/:id - Update merchant (owner or Admin only)
router.put("/:id", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        const merchant = await Merchant.findById(req.params.id);

        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        // Shop Owners can only update their own merchant
        if (req.user.role === "Shop Owner" && merchant.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only edit your own merchant." });
        }

        const { name, description, address, phone, email, image, available } = req.body;

        if (name !== undefined) merchant.name = name;
        if (description !== undefined) merchant.description = description;
        if (address !== undefined) merchant.address = address;
        if (phone !== undefined) merchant.phone = phone;
        if (email !== undefined) merchant.email = email;
        if (image !== undefined) merchant.image = image;
        if (available !== undefined) merchant.available = available;

        await merchant.save();

        res.status(200).json({
            message: "Merchant updated successfully.",
            merchant: merchant
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update merchant." });
    }
});

// DELETE /api/merchants/:id - Deactivate merchant (owner or Admin only)
router.delete("/:id", authenticate, requireRole("Shop Owner", "Merchant Admin"), async function (req, res) {
    try {
        const merchant = await Merchant.findById(req.params.id);

        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        // Shop Owners can only deactivate their own merchant
        if (req.user.role === "Shop Owner" && merchant.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only deactivate your own merchant." });
        }

        merchant.active = false;
        await merchant.save();

        res.status(200).json({ message: "Merchant deactivated successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to deactivate merchant." });
    }
});

module.exports = router;
