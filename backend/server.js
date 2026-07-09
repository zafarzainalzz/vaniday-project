const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("*", function (req, res) {
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
