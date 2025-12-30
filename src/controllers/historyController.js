const BalanceHistory = require('../models/balanceHistory');

async function getHistories(req, res) {
  try {
    const { start, end } = req.query || {};
    const filter = {};
    if (start || end) filter.created_at = {};
    if (start) filter.created_at.$gte = new Date(start);
    if (end) filter.created_at.$lte = new Date(end);
    const histories = await BalanceHistory.find(filter).sort({ created_at: -1 });
    return res.status(200).json({ data: histories });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getHistories };
