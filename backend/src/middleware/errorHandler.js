/**
 * Global Error Handler
 * Catches all errors thrown/passed via next(err) across the app
 * Formats them into a consistent API response
 */

const errorHandler = (err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV === "development") {
    console.error("\n❌ Error:", err.message);
    console.error(err.stack);
  } else {
    console.error("Error:", err.message);
  }

  // Prisma known errors
  if (err.code === "P2002") {
    // Unique constraint violation
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  if (err.code === "P2025") {
    // Record not found
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  if (err.code === "P2003") {
    // Foreign key constraint
    return res.status(400).json({
      success: false,
      message: "Related record not found.",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired." });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Max 20MB allowed." });
  }

  // Default 500
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
