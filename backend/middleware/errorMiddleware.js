function errorMiddleware(err, req, res, next) {
  if (err.name === "CastError") {
    return res.status(400).json({
      msg: "Invalid ID",
    });
  }
  return res.status(500).json({
    msg: "Internal server error",
  });
}

export default errorMiddleware;
