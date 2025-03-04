const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the brand name'],
      maxlength: 50,
    },
    category: {
      type: String,
      enum: ['Clothing', 'Shoes', 'Accessories', 'Tableware', 'Other'],
      required: [true, 'Please select a category'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a short description'],
      maxlength: 500,
    },
    website: {
      type: String,
      required: [true, 'Please provide the brand website'],
    },
    ecoFriendly: {
      type: Boolean,
      default: false,
    },
    nonToxic: {
      type: Boolean,
      default: false,
    },
    plasticFree: {
      type: Boolean,
      default: false,
    },
    veganCrueltyFree: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

BrandSchema.index({ name: 'text', category: 1 });

module.exports = mongoose.model('Brand', BrandSchema);
