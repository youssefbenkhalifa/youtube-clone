const jwt = require('jsonwebtoken');

// Optional authentication middleware: attaches req.user if token is valid, else continues as guest
module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next();
  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Ignore invalid token, treat as unauthenticated
  }
  next();
};
