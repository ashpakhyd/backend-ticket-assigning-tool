// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* =====================
   MIDDLEWARES
===================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================
   DATABASE CONNECTION
===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

/* =====================
   ROUTES
===================== */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/tickets", require("./routes/ticket.routes"));
app.use("/api/tickets", require("./routes/comment.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api", require("./routes/rating.routes"));
app.use("/api", require("./routes/dashboard.routes"));

/* =====================
   STATIC FILES
===================== */
app.use("/uploads", express.static("uploads"));

/* =====================
   HEALTH CHECK (OPTIONAL)
===================== */
app.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = app;
