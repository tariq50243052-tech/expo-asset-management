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

    // 3. Create Default Store Admins
    const defaultAdmins = [
      { name: 'SCY Admin', email: 'scy@expo.com', storeName: 'SCY ASSET' },
      { name: 'IT Admin', email: 'it@expo.com', storeName: 'IT ASSET' },
      { name: 'NOC Admin', email: 'noc@expo.com', storeName: 'NOC ASSET' }
    ];

    for (const adminData of defaultAdmins) {
      const store = storeMap[adminData.storeName];
      
      if (store) {
        let adminUser = await User.findOne({ email: adminData.email });
        
        if (!adminUser) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          await User.create({
            name: adminData.name,
            email: adminData.email,
            password: hashedPassword,
            role: 'Admin',
            assignedStore: store._id
          });
          console.log(`Created ${adminData.name}: ${adminData.email} / admin123`);
        } else {
          // Check and update permissions if needed
          let needsUpdate = false;
          
          if (adminUser.role !== 'Admin') {
            adminUser.role = 'Admin';
            needsUpdate = true;
          }
          
          if (!adminUser.assignedStore || adminUser.assignedStore.toString() !== store._id.toString()) {
            adminUser.assignedStore = store._id;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await adminUser.save();
            console.log(`Updated permissions for ${adminData.name} (Role: Admin, Store: ${adminData.storeName})`);
          } else {
            console.log(`Admin exists and is up to date: ${adminData.email}`);
          }
        }
      } else {
        console.error(`Store ${adminData.storeName} not found for admin ${adminData.email}`);
      }
    }

    console.log('Seeding Stores, Super Admin, and Default Admins completed.');

  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedStoresAndUsers;
