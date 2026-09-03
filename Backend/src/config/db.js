const mongoose = require("mongoose");

async function connectDB() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!mongoUrl) {
    throw new Error("MONGO_URL (or MONGO_URI) environment variable is not defined");
  }

  try {
    const conn = await mongoose.connect(mongoUrl);
    console.log(`DB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
}

module.exports = connectDB;