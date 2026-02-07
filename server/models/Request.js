const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Ordered', 'Rejected'], default: 'Pending' },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true }
}, { timestamps: true });

// Index for fetching requests by store and status
requestSchema.index({ store: 1, status: 1 });
requestSchema.index({ requester: 1 });

module.exports = mongoose.model('Request', requestSchema);

