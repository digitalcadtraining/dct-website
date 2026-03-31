/**
 * DigitalCAD Training - Express Server
 * Entry point: loads config, middleware, routes, then starts listening
 */

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const compression= require("compression");
const cookieParser=require("cookie-parser");
const rateLimit  = require("express-rate-limit");

const routes        = require("./src/routes/index");
const errorHandler  = require("./src/middleware/errorHandler");
const { prisma }    = require("./src/config/db");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── SECURITY MIDDLEWARE ───────────────────────────────────
app.use(helmet());   // Sets secure HTTP headers

// ── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,   // Allow cookies (refresh token)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── GENERAL RATE LIMITING ─────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(generalLimiter);

// ── BODY PARSING ─────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

// ── LOGGING ──────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── HEALTH CHECK ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "DCT API is running", timestamp: new Date() });
});

// ── API ROUTES ────────────────────────────────────────────
app.use("/api/v1", routes);

// ── 404 HANDLER ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────
app.use(errorHandler);

// ── START SERVER ─────────────────────────────────────────
async function startServer() {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 DCT Server running on http://localhost:${PORT}`);
      console.log(`📋 API docs: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
