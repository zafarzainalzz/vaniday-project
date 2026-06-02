const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bookingRoutes = require("./routes/bookingRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/bookings", bookingRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(function () {
    console.log("MongoDB connected");
  })
  .catch(function (error) {
    console.log("MongoDB connection error:");
    console.error(error);
  });

app.get("/", function (req, res) {
  res.send("Vaniday backend is running");
});

app.listen(process.env.PORT, function () {
  console.log("Server started");
});