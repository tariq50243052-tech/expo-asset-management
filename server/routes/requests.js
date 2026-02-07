const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const xlsx = require('xlsx');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  try {
    const { item_name, quantity, description, store } = req.body;
    const request = await Request.create({
      item_name,
      quantity,
      description,
      requester: req.user._id,
      store
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.activeStore) filter.store = req.activeStore;
    
    let requests = await Request.find(filter)
      .populate('requester', 'name email phone username')
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .lean();
    if (q) {
      const rx = new RegExp(q, 'i');
      requests = requests.filter(r =>
        rx.test(r.requester?.name || '') ||
        rx.test(r.requester?.email || '') ||
        rx.test(r.requester?.phone || '') ||
        rx.test(r.requester?.username || '')
      );
    }
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Isolation Check
    if (req.activeStore && request.store && request.store.toString() !== req.activeStore.toString()) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = req.body.status || request.status;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

// Export requests to Excel
router.get('/export', protect, admin, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.activeStore) filter.store = req.activeStore;
    
    let requests = await Request.find(filter)
      .populate('requester', 'name email phone username')
      .populate('store', 'name')
      .sort({ updatedAt: -1 })
      .lean();
    if (q) {
      const rx = new RegExp(q, 'i');
      requests = requests.filter(r =>
        rx.test(r.requester?.name || '') ||
        rx.test(r.requester?.email || '') ||
        rx.test(r.requester?.phone || '') ||
        rx.test(r.requester?.username || '')
      );
    }
    const data = requests.map(r => ({
      Item: r.item_name,
      Quantity: r.quantity,
      Description: r.description || '',
      Status: r.status,
      Store: r.store ? r.store.name : '',
      TechnicianName: r.requester ? r.requester.name : '',
      TechnicianEmail: r.requester ? r.requester.email : '',
      TechnicianPhone: r.requester ? (r.requester.phone || '') : '',
      TechnicianUsername: r.requester ? (r.requester.username || '') : '',
      CreatedAt: r.createdAt,
      UpdatedAt: r.updatedAt,
    }));
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Requests');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=requests.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Technician: list own requests
router.get('/mine', protect, async (req, res) => {
  try {
    const filter = { requester: req.user._id };
    if (req.activeStore) {
      filter.store = req.activeStore;
    }
    const my = await Request.find(filter)
      .populate('store', 'name')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(my);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
