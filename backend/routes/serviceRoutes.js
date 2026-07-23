const express = require("express");
const Service = require("../models/Service");
const Merchant = require("../models/Merchant");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

async function isMerchantOwner(userId, role, merchantId) {
    if (role === "Admin") {
        return true;
    }

    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
        return false;
    }

    return merchant.owner.toString() === userId;
}

// POST /api/services - Create a service (Shop Owner for their merchant, or Admin)
router.post("/", authenticate, requireRole("Shop Owner", "Admin"), async function (req, res) {
    try {
        const { merchant, name, description, price, duration } = req.body;

        if (!merchant || !name || price == null) {
            return res.status(400).json({ message: "Merchant ID, service name, and price are required." });
        }

        const merchantDoc = await Merchant.findById(merchant);

        if (!merchantDoc) {
            return res.status(404).json({ message: "Merchant not found." });
        }

        // Shop Owners can only add services to their own merchant
        if (req.user.role === "Shop Owner" && merchantDoc.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only add services to your own merchant." });
        }

        const service = new Service({
            merchant: merchant,
            name: name,
            description: description || "",
            price: price,
            duration: duration || 60
        });

        await service.save();

        res.status(201).json({
            message: "Service created successfully.",
            service: service
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create service." });
    }
});

// GET /api/services - List active services (public, optional ?merchant=<id>)
router.get("/", async function (req, res) {
    try {
        var query = { active: true };

        if (req.query.merchant) {
            query.merchant = req.query.merchant;
        }

        const services = await Service.find(query).populate("merchant", "name owner active");
        res.status(200).json(services);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get services." });
    }
});

// GET /api/services/:id - Get single service (public)
router.get("/:id", async function (req, res) {
    try {
        const service = await Service.findById(req.params.id).populate("merchant", "name owner active");

        if (!service) {
            return res.status(404).json({ message: "Service not found." });
        }

        res.status(200).json(service);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get service." });
    }
});

// PUT /api/services/:id - Update service (owner of parent merchant or Admin)
router.put("/:id", authenticate, requireRole("Shop Owner", "Admin"), async function (req, res) {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: "Service not found." });
        }

        const allowed = await isMerchantOwner(req.user.id, req.user.role, service.merchant);

        if (!allowed) {
            return res.status(403).json({ message: "Access denied. You can only edit services for your own merchant." });
        }

        const { name, description, price, duration } = req.body;

        if (name !== undefined) service.name = name;
        if (description !== undefined) service.description = description;
        if (price !== undefined) service.price = price;
        if (duration !== undefined) service.duration = duration;

        await service.save();

        res.status(200).json({
            message: "Service updated successfully.",
            service: service
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update service." });
    }
});

// DELETE /api/services/:id - Deactivate service (owner of parent merchant or Admin)
router.delete("/:id", authenticate, requireRole("Shop Owner", "Admin"), async function (req, res) {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: "Service not found." });
        }

        const allowed = await isMerchantOwner(req.user.id, req.user.role, service.merchant);

        if (!allowed) {
            return res.status(403).json({ message: "Access denied. You can only deactivate services for your own merchant." });
        }

        service.active = false;
        await service.save();

        res.status(200).json({ message: "Service deactivated successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to deactivate service." });
    }
});

module.exports = router;
