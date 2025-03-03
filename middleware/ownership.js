const Brand = require('../models/Brand');

const ownershipMiddleware = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).send('Brand not found.');
    }

    if (brand.createdBy.toString() !== req.user._id.toString()) {
      req.flash('error', 'You do not have permission to modify this brand.');
      return res.status(403).send('Forbidden');
    }

    next();
  } catch (error) {
    next(error);
    res.status(500).send('Server error');
  }
};

module.exports = ownershipMiddleware;
