const crypto = require('crypto');
const UserToken = require('../models/userToken');
const User = require('../models/user');

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });
    }

    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await UserToken.findOne({ hash: tokenHash });
    if (!stored) {
      return res.status(401).json({ message: 'Invalid token', error: 'Unauthorized', statusCode: 401 });
    }

    const user = await User.findOne({ id: stored.user_id });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token', error: 'Unauthorized', statusCode: 401 });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
