const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "vaniday-dev-secret-change-in-production";

function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function authenticate(req, res, next) {
    var authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required. Please provide a valid token." });
    }

    var token = authHeader.split(" ")[1];

    try {
        var decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
    }
}

function requireRole() {
    var allowedRoles = Array.prototype.slice.call(arguments);

    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        if (allowedRoles.indexOf(req.user.role) === -1) {
            return res.status(403).json({ message: "Access denied. Required role: " + allowedRoles.join(" or ") });
        }

        next();
    };
}

module.exports = { generateToken: generateToken, authenticate: authenticate, requireRole: requireRole };
