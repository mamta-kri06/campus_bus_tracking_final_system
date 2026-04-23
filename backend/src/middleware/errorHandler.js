const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
