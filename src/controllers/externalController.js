async function getCurrentWeather(req, res) {
  try {
    const options = ['clear', 'fog', 'rain', 'snow'];
    const weather = options[Math.floor(Math.random() * options.length)];
    const temperature = Math.floor(Math.random() * 35); // 0..34°C
    return res.status(200).json({ weather, temperature });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getCurrentTraffic(req, res) {
  try {
    const colors = ['green', 'yellow', 'red', 'black'];
    const qColor = req.query.color;
    const qNumber = req.query.number ? Number(req.query.number) : undefined;
    let color_scale_of_corks;
    if (qColor && colors.includes(qColor)) color_scale_of_corks = qColor;
    else color_scale_of_corks = colors[Math.floor(Math.random() * colors.length)];

    let number_scale;
    if (typeof qNumber === 'number' && !Number.isNaN(qNumber) && qNumber >= 1 && qNumber <= 100) number_scale = Math.floor(qNumber);
    else number_scale = Math.floor(Math.random() * 100) + 1; // 1..100

    return res.status(200).json({ color_scale_of_corks, number_scale });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

async function getDynamicPrice(req, res) {
  try {
    const base_price = parseFloat(req.query.base_price);
    const min_price = parseFloat(req.query.min_price);
    const max_price = parseFloat(req.query.max_price);

    if ([base_price, min_price, max_price].some(v => Number.isNaN(v))) {
      return res.status(400).json({ message: 'Bad Request', statusCode: 400 });
    }
    if (min_price > max_price) return res.status(400).json({ message: 'Bad Request', statusCode: 400 });

    const colors = ['green', 'yellow', 'red', 'black'];
    const qColor = req.query.color;
    const qNumber = req.query.number ? Number(req.query.number) : undefined;
    let color_scale_of_corks;
    if (qColor && colors.includes(qColor)) color_scale_of_corks = qColor;
    else color_scale_of_corks = colors[Math.floor(Math.random() * colors.length)];

    let number_scale;
    if (typeof qNumber === 'number' && !Number.isNaN(qNumber) && qNumber >= 1 && qNumber <= 100) number_scale = Math.floor(qNumber);
    else number_scale = Math.floor(Math.random() * 100) + 1; // 1..100

    const multipliers = { green: 0.9, yellow: 1, red: 1.2, black: 1.5 };
    const color_multiplier = multipliers[color_scale_of_corks] || 1;

    let dynamic_price = base_price * (1 + number_scale / 100) * color_multiplier;
    dynamic_price = clamp(dynamic_price, min_price, max_price);
    dynamic_price = Math.round(dynamic_price * 100) / 100;

    return res.status(200).json({ data: { dynamic_price, traffic: { color_scale_of_corks, number_scale } } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getCurrentWeather, getCurrentTraffic, getDynamicPrice };

