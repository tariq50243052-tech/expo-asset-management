const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const seedCategories = require('./utils/seedCategories'); // Import seeder
const seedStoresAndUsers = require('./utils/seedStoresAndUsers');
const compression = require('compression');

// Routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const userRoutes = require('./routes/users');
const assetRoutes = require('./routes/assets');
const requestRoutes = require('./routes/requests');
const passRoutes = require('./routes/passes');
const vendorRoutes = require('./routes/vendors');
const poRoutes = require('./routes/purchaseOrders');
const assetCategoryRoutes = require('./routes/assetCategories');
const permitRoutes = require('./routes/permits');
const systemRoutes = require('./routes/system');

// Models for seeding
const Store = require('./models/Store');

const Asset = require('./models/Asset');
const Request = require('./models/Request');
const AssetCategory = require('./models/AssetCategory');

dotenv.config();

const app = express();

app.use(compression({
  level: 6,
  threshold: 0,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/asset-categories', assetCategoryRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/system', systemRoutes);

const User = require('./models/User');
const bcrypt = require('bcryptjs');
const ActivityLog = require('./models/ActivityLog');
const { protect, admin } = require('./middleware/authMiddleware');

// Serve built client in production
const fs = require('fs');
const clientDist = path.resolve(__dirname, '../client/dist');
const indexHtml = path.join(clientDist, 'index.html');
let clientBuilt = false;

try {
  if (fs.existsSync(clientDist) && fs.existsSync(indexHtml)) {
    clientBuilt = true;
  }
} catch (error) {
  console.error('Error checking static files:', error);
}

// 404 Handler (Must be before Catch-all for API 404s, but here we want catch-all to handle everything else)
// Actually, we should handle API 404s explicitly if we want JSON response, otherwise catch-all takes it.
// Let's stick to standard order: 
// 1. API Routes (already defined above)
// 2. Static Files
// 3. Catch-All (SPA or Fallback)

// Debug Route to check File System (Temporary)
app.get('/debug-fs', (req, res) => {
  const fs = require('fs');
  const debugInfo = {
    cwd: process.cwd(),
    __dirname: __dirname,
    clientDistPath: clientDist,
    clientDistExists: fs.existsSync(clientDist),
    rootDirContents: [],
    clientDirContents: [],
    distDirContents: []
  };

  try {
    const rootDir = path.resolve(__dirname, '..');
    debugInfo.rootDirContents = fs.readdirSync(rootDir);
    
    const clientDir = path.resolve(rootDir, 'client');
    if (fs.existsSync(clientDir)) {
      debugInfo.clientDirContents = fs.readdirSync(clientDir);
    }
    
    if (fs.existsSync(clientDist)) {
      debugInfo.distDirContents = fs.readdirSync(clientDist);
    }
  } catch (error) {
    debugInfo.error = error.message;
  }

  res.json(debugInfo);
});

if (clientBuilt) {
  console.log('Serving static files from:', clientDist);
  app.use(express.static(clientDist));
  
  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    // Skip if request is for API (redundant if API routes matched first, but safe)
    if (req.path.startsWith('/api')) {
       return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Double check file exists to prevent crashes
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(500).send('index.html missing');
    }
  });
} else {
  console.log('Client dist folder or index.html not found at:', clientDist);
  // Fallback route if client is not built - catch ALL non-api routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
       return res.status(404).json({ message: 'API endpoint not found' });
    }

    // Check if it's the debug route
    if (req.path === '/debug-fs') {
        // We need to define debug route BEFORE this catch-all if we want it to work in this block
        // Or just let this fall through? No, app.get('*') captures it.
        // Let's move debug route UP.
        return res.status(404).send('Debug route moved');
    }

    res.status(200).send(`
      <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1>API is running successfully</h1>
        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <strong>Warning:</strong> Frontend client is not served because the build folder was not found.
        </div>
        <p>This likely means the build command on Render is incorrect.</p>
        
        <h3>Required Render Settings:</h3>
        <ul>
          <li><strong>Root Directory:</strong> <code>.</code> (Leave empty)</li>
          <li><strong>Build Command:</strong> <code>npm run build</code></li>
          <li><strong>Start Command:</strong> <code>npm start</code></li>
        </ul>
        
        <p>Debug info available at <a href="/debug-fs">/debug-fs</a></p>
        <p>Current Path: ${req.url}</p>
      </div>
    `);
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedCategories();
    await seedStoresAndUsers();
    dropSerialUniqueIndex();
  })
  .catch(err => console.log(err));

// Seed Default Stores
const seedStores = async () => {
  const stores = [
    "Mobility Car Park Store-10",
    "Mobility Car Park Store-8",
    "Sustainability Basement Store",
    "Terra Basement Store",
    "Al Wasl 3 Level 2 Store"
  ];

  try {
    const count = await Store.countDocuments();
    if (count === 0) {
      const storeDocs = stores.map(name => ({ name }));
      await Store.insertMany(storeDocs);
      console.log('Default stores seeded');
    }
  } catch (error) {
    console.error('Error seeding stores:', error);
  }
};

// Seed Default Asset Categories
const seedAssetCategories = async () => {
  const categories = [
    'Access Control Systems',
    'Surveillance System',
    'Networking',
    'Telephony',
    'Structured Cabling',
    'Tools',
    'Wireless',
    'Audio Visual'
  ];

  try {
    const count = await AssetCategory.countDocuments();
    if (count === 0) {
      await AssetCategory.insertMany(categories.map(name => ({ name })));
      console.log('Default asset categories seeded');
    }
  } catch (error) {
    console.error('Error seeding asset categories:', error);
  }
};

const dropSerialUniqueIndex = async () => {
  try {
    const collection = mongoose.connection.collection('assets');
    const indexes = await collection.indexes();
    const serialIndex = indexes.find(idx => idx.name === 'serialNumber_1');
    
    if (serialIndex) {
      await collection.dropIndex('serialNumber_1');
      console.log('Dropped unique index on serialNumber');
    }
  } catch (error) {
    // Index might not exist, ignore error
  }
};

const seedAdmin = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'Admin',
        employeeId: 'ADMIN001'
      });
      console.log('Admin user seeded');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// 404 Handler (Last Route)
app.use((req, res) => {
  res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
