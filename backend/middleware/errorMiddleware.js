function errorMiddleware(err, req, res, next) {
  if (err.name === "CastError") {
    return res.status(400).json({
      msg: "Invalid ID",
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    return res.status(409).json({
      msg: `${field} already exists`,
    });
  }

  if (err.name === "ValidationError") {
    const errors = {};

    for (const field of Object.keys(err.errors)) {
      errors[field] = err.errors[field].message;
    }

    return res.status(400).json({
      msg: "Validation failed",
      errors,
    });
  }

  return res.status(500).json({
    msg: "Internal server error",
  });
}

export default errorMiddleware;
