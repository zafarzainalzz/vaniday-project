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

dotenv.config();

requireEnvironmentVariable("MONGO_URI");
requireEnvironmentVariable("JWT_SECRET");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(function () {
    console.log("MongoDB connected");
  })
  .catch(function (error) {
    console.log("MongoDB connection error:");
    console.error(error);
  });

app.listen(process.env.PORT, function () {
  console.log("Server started on port " + process.env.PORT);
});
