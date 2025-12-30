const Category = require('../models/category');
const Application = require('../models/application');

async function getWorks(req, res) {
  try {
    const cats = await Category.find();
    const items = cats.map(c => ({ id: c.id, name: c.name, rating: null }));
    return res.status(200).json({ data: { items } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function sendRequest(req, res) {
  try {
    const targetUserId = req.params.userId;
    const applicant = req.user;
    if (!applicant) return res.status(401).json({ message: 'Unauthorized', statusCode: 401 });

    // find first category for target user
    const category = await Category.findOne({ user_id: targetUserId });
    if (!category) return res.status(404).json({ message: 'User not found', error: 'Not Found', statusCode: 404 });

    const exists = await Application.findOne({ user_id: applicant.id, category_id: category.id });
    if (exists) return res.status(409).json({ message: 'The application has already been sent', error: 'Conflict', statusCode: 409 });

    await Application.create({ id: require('crypto').randomUUID(), category_id: category.id, user_id: applicant.id });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getWorks, sendRequest };
