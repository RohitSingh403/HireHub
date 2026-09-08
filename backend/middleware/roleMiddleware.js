const roleMiddleware = function (req, res, next) {
  try {
    const currentRole = req.user.role;
    if (currentRole !== "candidate" && currentRole !== "recruiter" && currentRole !== "admin" ) {
      return res.status(403).json({
        err: "Not allowed",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      err: "Internal server error",
    });
  }
};
