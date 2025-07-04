const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // get token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded contains user id
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
