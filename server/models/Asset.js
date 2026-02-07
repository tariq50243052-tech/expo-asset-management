const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  model_number: {
    type: String,
    required: true,
    index: true
  },
  serial_number: {
    type: String,
    required: true,
    index: true
  },
  serial_last_4: {
    type: String,
    required: true,
    index: true // Indexed for fast search
  },
  mac_address: {
    type: String,
    default: '',
    index: true
  },
  ticket_number: {
    type: String,
    default: '',
    index: true
  },
  rfid: {
    type: String,
    default: '',
    index: true
  },
  qr_code: {
    type: String,
    default: '',
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true,
    default: 'Other'
  },
  uniqueId: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined values to exist (though we aim to fill them)
  },
  manufacturer: {
    type: String,
    default: '',
    index: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false,
    index: true
  },
  location: {
    type: String,
    default: '',
    index: true
  },
  product_type: {
    type: String,
    index: true
  },
  product_name: {
    type: String,
    index: true
  },
  status: {
    type: String,
    enum: ['New', 'Used', 'Faulty', 'Disposed', 'Under Repair'],
    default: 'New',
    index: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assigned_to_external: {
    name: String,
    phone: String,
    note: String
  },
  return_pending: {
    type: Boolean,
    default: false
  },
  return_request: {
    condition: { type: String, enum: ['New', 'Used', 'Faulty'] },
    ticket_number: String,
    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requested_by_name: String,
    requested_at: { type: Date }
  },
  history: [{
    action: String,
    ticket_number: String,
    user: String,
    details: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Compound index for finding assets by serial number within a store (optional but good for performance)
assetSchema.index({ store: 1, serial_number: 1 });
assetSchema.index({ store: 1, serial_last_4: 1 });
// Performance indexes for sorting and filtering
assetSchema.index({ store: 1, updatedAt: -1 });
assetSchema.index({ store: 1, status: 1 });
assetSchema.index({ updatedAt: -1 });

// Text index for fast search
assetSchema.index({
  name: 'text',
  model_number: 'text',
  serial_number: 'text',
  manufacturer: 'text',
  product_name: 'text',
  ticket_number: 'text'
});

module.exports = mongoose.model('Asset', assetSchema);
