const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// @desc    Get all POs
// @route   GET /api/purchase-orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const { vendor, status, startDate, endDate } = req.query;
    const filter = {};

    if (vendor) filter.vendor = vendor;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const pos = await PurchaseOrder.find(filter)
      .populate('vendor', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single PO
// @route   GET /api/purchase-orders/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendor');
    if (po) {
      // Enforce Isolation
      if (req.activeStore && po.store && po.store.toString() !== req.activeStore.toString()) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }
      res.json(po);
    } else {
      res.status(404).json({ message: 'Purchase Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a PO
// @route   POST /api/purchase-orders
// @access  Private/Admin
router.post('/', protect, admin, upload.array('attachments'), async (req, res) => {
  try {
    let poNumber = req.body.poNumber;

    // Parse items if it's a string (from FormData)
    if (typeof req.body.items === 'string') {
      try {
        req.body.items = JSON.parse(req.body.items);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid items format' });
      }
    }

    // If poNumber is provided, check for duplicates
    if (poNumber) {
      const existingPO = await PurchaseOrder.findOne({ poNumber });
      if (existingPO) {
        return res.status(400).json({ message: 'PO Number already exists' });
      }
    } else {
      // Auto-generate if not provided
      const count = await PurchaseOrder.countDocuments();
      poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    const attachments = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const po = await PurchaseOrder.create({
      ...req.body,
      poNumber,
      attachments,
      createdBy: req.user._id,
      store: req.activeStore
    });

    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a PO
// @route   PUT /api/purchase-orders/:id
// @access  Private/Admin
router.put('/:id', protect, admin, upload.array('attachments'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);

    if (po) {
      if (req.activeStore && po.store && po.store.toString() !== req.activeStore.toString()) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }

      // Parse items if string
      if (typeof req.body.items === 'string') {
        try {
          req.body.items = JSON.parse(req.body.items);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid items format' });
        }
      }

      const newAttachments = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
      
      // Combine existing attachments with new ones (if any logic needed for removal, handle separately)
      // Here we just append new ones. 
      // If the frontend sends 'existingAttachments' array, we could use that to filter out removed ones.
      // For now, let's just append.
      const updatedAttachments = [...(po.attachments || []), ...newAttachments];
      
      // Update fields
      Object.assign(po, req.body);
      po.attachments = updatedAttachments; // explicit set to ensure merge

      const updatedPO = await po.save();
      res.json(updatedPO);
    } else {
      res.status(404).json({ message: 'Purchase Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a PO
// @route   DELETE /api/purchase-orders/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);

    if (po) {
      if (req.activeStore && po.store && po.store.toString() !== req.activeStore.toString()) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }
      
      await po.deleteOne();
      res.json({ message: 'Purchase Order removed' });
    } else {
      res.status(404).json({ message: 'Purchase Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
