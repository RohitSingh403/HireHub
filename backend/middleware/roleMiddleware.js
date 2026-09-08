const roleMiddleware = function (allowedRole) {
  return function (req, res, next) {
    try {
      const currentRole = req.user.role;
      if (currentRole !== allowedRole) {
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
};

export default roleMiddleware;
