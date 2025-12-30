const Tariff = require('../models/tariff');
const Bicycle = require('../models/bicycle');

async function getBicycleTariffs(req, res) {
  try {
    const { bicycleId } = req.params;
    const b = await Bicycle.findOne({ id: bicycleId });
    if (!b) return res.status(404).json({ message: 'Bicycle not found', error: 'Not Found', statusCode: 404 });

    const tariffs = await Tariff.find({ category_id: b.category_id, deleted_at: null });
    const data = tariffs.map(t => {
      if (t.type === 'STATIC') return { id: t.id, name: t.name, type: t.type, price: t.base_price };
      return { id: t.id, name: t.name, type: t.type, price: t.base_price, additionalPrices: { min: t.min_price, max: t.max_price } };
    });
    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getCurrentPrice(req, res) {
  try {
    const { bicycleId, tariffId } = req.params;
    const tariff = await Tariff.findOne({ id: tariffId });
    if (!tariff) return res.status(404).json({ message: 'Tariff not found', error: 'Not Found', statusCode: 404 });

    // For simplicity, return base_price as current price
    return res.status(200).json({ data: { price: tariff.base_price } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getBicycleTariffs, getCurrentPrice };
