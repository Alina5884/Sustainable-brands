const Brand = require('../models/Brand');

exports.list = async (req, res) => {
  try {
    const search = Array.isArray(req.query.search)
      ? req.query.search.find((s) => s.trim() !== '') || ''
      : req.query.search || '';
    const category = Array.isArray(req.query.category)
      ? req.query.category
      : req.query.category
        ? [req.query.category]
        : [];
    const ecoFriendly = req.query.ecoFriendly === 'true';
    const nonToxic = req.query.nonToxic === 'true';
    const plasticFree = req.query.plasticFree === 'true';
    const veganCrueltyFree = req.query.veganCrueltyFree === 'true';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 9;

    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    if (category.length > 0) query.category = { $in: category };
    if (ecoFriendly) query.ecoFriendly = true;
    if (nonToxic) query.nonToxic = true;
    if (plasticFree) query.plasticFree = true;
    if (veganCrueltyFree) query.veganCrueltyFree = true;

    const totalBrands = await Brand.countDocuments(query);
    const skip = (page - 1) * pageSize;

    const brands = await Brand.find(query)
      .sort({ name: sortOrder })
      .skip(skip)
      .limit(pageSize);

    res.render('brands', {
      brands,
      search,
      category,
      ecoFriendly,
      nonToxic,
      plasticFree,
      veganCrueltyFree,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      currentPage: page,
      totalPages: Math.ceil(totalBrands / pageSize),
      csrfToken: req.csrfToken(),
      user: req.user,
      showMyBrands: false,
      showHomeButton: true,
    });
  } catch (err) {
    console.error('Error retrieving brands:', err);
    next(err);
  }
};

exports.myBrands = async (req, res) => {
  try {
    if (!req.user) {
      console.error('User not authenticated');
      return res.status(401).send('User not authenticated');
    }
    const search = Array.isArray(req.query.search)
      ? req.query.search.find((s) => s.trim() !== '') || ''
      : req.query.search || '';
    const category = Array.isArray(req.query.category)
      ? req.query.category
      : req.query.category
        ? [req.query.category]
        : [];
    const ecoFriendly = req.query.ecoFriendly === 'true';
    const nonToxic = req.query.nonToxic === 'true';
    const plasticFree = req.query.plasticFree === 'true';
    const veganCrueltyFree = req.query.veganCrueltyFree === 'true';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 9;

    const query = { createdBy: req.user._id };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    if (category.length > 0) query.category = { $in: category };
    if (ecoFriendly) query.ecoFriendly = true;
    if (nonToxic) query.nonToxic = true;
    if (plasticFree) query.plasticFree = true;
    if (veganCrueltyFree) query.veganCrueltyFree = true;

    const totalBrands = await Brand.countDocuments(query);
    const skip = (page - 1) * pageSize;

    const brands = await Brand.find(query)
      .sort({ name: sortOrder })
      .skip(skip)
      .limit(pageSize);

    res.render('brands', {
      brands,
      search,
      category,
      ecoFriendly,
      nonToxic,
      plasticFree,
      veganCrueltyFree,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      currentPage: page,
      totalPages: Math.ceil(totalBrands / pageSize),
      csrfToken: req.csrfToken(),
      user: req.user,
      showMyBrands: true,
      showHomeButton: true,
    });
  } catch (err) {
    console.error('Error retrieving my brands:', err);
    return res.status(500).send(`Error retrieving my brands: ${err.message}`);
  }
};

exports.new = (req, res) => {
  res.render('editBrand', { brand: {} });
};

const parseBoolean = (value) => {
  if (Array.isArray(value)) return value.includes('true');
  return value === 'true';
};

exports.add = async (req, res) => {
  try {
    const brand = new Brand({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      logo: req.body.logo || '',
      website: req.body.website,
      ecoFriendly: parseBoolean(req.body.ecoFriendly),
      nonToxic: parseBoolean(req.body.nonToxic),
      plasticFree: parseBoolean(req.body.plasticFree),
      veganCrueltyFree: parseBoolean(req.body.veganCrueltyFree),
      createdBy: req.user._id,
    });

    await brand.save();

    req.flash('info', 'Brand added successfully!');
    res.redirect('/brands');
  } catch (err) {
    console.error('Error adding brand:', err);
    req.flash('error', 'Error adding brand.');
    next(err);
  }
};

exports.edit = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand || brand.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).send('Brand not found or not authorized');
    }

    res.render('editBrand', { brand, csrfToken: req.csrfToken() });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand || brand.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    const updateData = {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      logo: req.body.logo || '',
      website: req.body.website,
      ecoFriendly: parseBoolean(req.body.ecoFriendly),
      nonToxic: parseBoolean(req.body.nonToxic),
      plasticFree: parseBoolean(req.body.plasticFree),
      veganCrueltyFree: parseBoolean(req.body.veganCrueltyFree),
    };

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(500).send('Error updating brand');
    }

    req.flash('info', 'Brand updated successfully!');
    res.redirect('/brands');
  } catch (err) {
    console.error('Error updating brand:', err);
    req.flash('error', 'Error updating brand.');
    next(err);
  }
};

exports.delete = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand || brand.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    await Brand.deleteOne({ _id: req.params.id });
    req.flash('info', 'Brand deleted successfully!');
    res.redirect('/brands');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting brand.');
    next(err);
  }
};
