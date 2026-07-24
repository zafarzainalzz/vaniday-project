const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const shopRoutes = require("./routes/shopRoutes");
const stateRoutes = require("./routes/stateRoutes");
const { requireEnvironmentVariable } = require("./config");

dotenv.config({ path: path.join(__dirname, ".env") });

const mongoUri = requireEnvironmentVariable("MONGO_URI");
requireEnvironmentVariable("JWT_SECRET");

const app = express();
const allowedOrigins = String(process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map(function (origin) { return origin.trim(); })
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.get("/api/health", function (req, res) {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    envMongoUri: process.env.MONGO_URI ? "set" : "not set"
  });
});

app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/state", stateRoutes);

app.use(function (req, res, next) {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(function (error, req, res, next) {
  if (error && error.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});

const port = process.env.PORT || 5000;
mongoose.connect(mongoUri)
  .then(function () {
    console.log("MongoDB connected");
    app.listen(port, "0.0.0.0", function () {
      console.log("Server started on port " + port);
    });
  })
  .catch(function (error) {
    console.error("MongoDB connection error:");
    console.error(error);
    process.exit(1);
  });
