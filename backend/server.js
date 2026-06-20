/**
 * DigitalCAD Training - Express Server
 * Supabase-ready backend entry point.
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const routes = require("./src/routes/index");
const errorHandler = require("./src/middleware/errorHandler");
const { prisma, checkDatabaseConnection } = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

function normalizeOrigins(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const allowedOrigins = Array.from(new Set([
  ...normalizeOrigins(process.env.FRONTEND_URL),
  ...normalizeOrigins(process.env.CLIENT_URL),
  ...normalizeOrigins(process.env.EXTRA_CORS_ORIGINS),
  "https://digitalcadtraining.com",
  "https://www.digitalcadtraining.com",
  "http://digitalcadtraining.com",
  "http://www.digitalcadtraining.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
]));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = String(origin).replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(generalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

if (NODE_ENV !== "test") {
  app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/health", (req, res) => {
  res.json({ success: true, message: "DCT API is running", timestamp: new Date() });
});

app.get("/health/db", async (req, res) => {
  try {
    await checkDatabaseConnection();
    res.json({ success: true, message: "Database connected", timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ success: false, message: "Database not reachable", error: err.message });
  }
});

app.use("/api/v1", routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await checkDatabaseConnection();
      console.log("✅ Database connected");
      return;
    } catch (err) {
      lastError = err;
      console.error(`❌ Database connection failed (${attempt}/${maxAttempts}):`, err.message);
      if (attempt < maxAttempts) await wait(1500 * attempt);
    }
  }
  throw lastError;
}

async function startServer() {
  try {
    await connectWithRetry(Number(process.env.DB_CONNECT_RETRIES) || 3);
    app.listen(PORT, () => {
      console.log(`🚀 DCT Server running on http://localhost:${PORT}`);
      console.log(`📋 API base: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error("Check backend/.env DATABASE_URL and DIRECT_URL. For Supabase, use the pooler/direct connection string with sslmode=require.");
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
