import jwt from "jsonwebtoken";

const optionalAuthMiddleware = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader === undefined) {
    return next();
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }
};

export default optionalAuthMiddleware;
