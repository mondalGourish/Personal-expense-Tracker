require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

// Startup validation for critical configuration variables (fail-fast)
const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
const missingEnvVars = [];

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
  missingEnvVars.push("JWT_SECRET");
}

if (!mongoUri || mongoUri.trim() === "") {
  missingEnvVars.push("MONGO_URL (or MONGO_URI)");
}

if (missingEnvVars.length > 0) {
  console.error(
    `❌ FATAL CONFIGURATION ERROR: Missing required environment variable(s): ${missingEnvVars.join(
      ", "
    )}`
  );
  console.error("The server cannot start safely without these required configuration values.");
  process.exit(1);
}

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Currency default set to INR (₹)`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
