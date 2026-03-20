const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');




const app = express();

app.use(cors());


// ======================
// MIDDLEWARE
// ======================

// Handle large payloads (5K+ users)
app.use(express.json({ limit: "50mb" }));

// Compress responses (performance boost)
app.use(compression());


// Route prefix
app.use("/api/users", userRoutes);

// ======================
// HEALTH CHECK
// ======================

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ======================
// GLOBAL ERROR HANDLER
// ======================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================
// DATABASE CONNECTION
// ======================

  mongoose.connect("mongodb://127.0.0.1:27017/bulk-users")
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("❌ DB Connection Error:", err.message);
  });

// ======================
// SERVER START
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});