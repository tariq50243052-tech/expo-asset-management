const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  openingTime: {
    type: String, // Format: "HH:MM" 24h
    required: false,
    default: "09:00"
  },
  closingTime: {
    type: String, // Format: "HH:MM" 24h
    required: false,
    default: "17:00"
  },
  isMainStore: {
    type: Boolean,
    default: false,
    index: true
  },
  parentStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null,
    index: true
  },
  deletionRequested: {
    type: Boolean,
    default: false
  },
  deletionRequestedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
