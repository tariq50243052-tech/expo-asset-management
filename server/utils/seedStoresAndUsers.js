const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedStoresAndUsers = async () => {
  try {
    // 1. Create Stores
    const storesData = [
      { name: 'SCY ASSET' },
      { name: 'IT ASSET' },
      { name: 'NOC ASSET' }
    ];

    const storeMap = {};

    for (const sData of storesData) {
      let store = await Store.findOne({ name: sData.name });
      if (!store) {
        store = await Store.create({ ...sData, isMainStore: true });
        console.log(`Created Main Store: ${sData.name}`);
      } else {
        if (!store.isMainStore) {
            store.isMainStore = true;
            await store.save();
            console.log(`Updated Store (set Main): ${sData.name}`);
        } else {
            console.log(`Store exists: ${sData.name}`);
        }
      }
      storeMap[sData.name] = store;
    }

    // 2. Create Super Admin
    const superAdminEmail = 'superadmin@expo.com';
    const superAdminExists = await User.findOne({ email: superAdminEmail });

    if (!superAdminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);

      await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'Super Admin',
        // Super Admin is not restricted to a single store, so assignedStore can be null
        assignedStore: null 
      });
      console.log(`Created Super Admin: ${superAdminEmail} / superadmin123`);
    } else {
      // Ensure role is Super Admin
      if (superAdminExists.role !== 'Super Admin') {
          superAdminExists.role = 'Super Admin';
          await superAdminExists.save();
          console.log('Updated Super Admin role');
      }
      console.log('Super Admin already exists');
    }

    console.log('Seeding Stores and Super Admin completed.');

  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedStoresAndUsers;
