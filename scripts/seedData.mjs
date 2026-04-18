/**
 * Seed Script: Migrate menuItems.js data to Firebase Firestore
 * 
 * Usage:
 *   1. Create a .env file with your Firebase config (see .env.example)
 *   2. Run: node scripts/seedData.mjs
 * 
 * This script:
 *   - Seeds /menu collection with all items from the customer app
 *   - Seeds /tables collection with 10 tables
 *   - Seeds /settings/restaurant with default config
 *   - Creates initial manager staff document (you must create the Auth user first via Firebase Console)
 * 
 * Prerequisites:
 *   npm install firebase dotenv
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('❌ Firebase config not found. Create a .env file with your Firebase credentials.');
  console.error('   See .env.example for the required variables.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Menu items from the customer app
// We import them by reading the file and extracting the data
const menuItemsPath = join(__dirname, '..', '..', 'foodmenu', 'src', 'menuItems.js');

async function seedMenu() {
  console.log('📋 Seeding menu items...');
  
  // Read and parse menuItems.js
  const content = readFileSync(menuItemsPath, 'utf-8');
  
  // Extract the array from the file using a simple approach
  // Parse JSON-like objects from the JS file
  const items = [];
  const regex = /\{\s*id:\s*(\d+),\s*name:\s*'([^']*)',\s*nameKh:\s*'([^']*)',\s*category:\s*'([^']*)',\s*price:\s*([\d.]+),\s*image:\s*'([^']*)',\s*description:\s*'([^']*)',\s*ingredients:\s*\[([^\]]*)\]\s*\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const ingredients = match[8]
      .split(',')
      .map(s => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    
    items.push({
      id: parseInt(match[1]),
      name: match[2],
      nameKh: match[3],
      category: match[4],
      price: parseFloat(match[5]),
      image: match[6],
      description: match[7],
      ingredients,
      available: true,
      sortOrder: parseInt(match[1]),
      createdAt: new Date(),
    });
  }

  console.log(`   Found ${items.length} menu items`);
  
  for (const item of items) {
    await setDoc(doc(db, 'menu', `item_${item.id}`), item);
  }
  console.log(`   ✅ ${items.length} menu items seeded`);
}

async function seedTables() {
  console.log('🪑 Seeding tables...');
  
  for (let i = 1; i <= 10; i++) {
    await setDoc(doc(db, 'tables', `table_${i}`), {
      number: i,
      name: `Table ${i}`,
      status: 'available',
      currentOrderId: null,
      capacity: i <= 4 ? 4 : i <= 8 ? 6 : 8, // Small, medium, large tables
      createdAt: new Date(),
    });
  }
  console.log('   ✅ 10 tables seeded');
}

async function seedSettings() {
  console.log('⚙️  Seeding settings...');
  
  await setDoc(doc(db, 'settings', 'restaurant'), {
    restaurantName: 'Khmer Surin Restaurant',
    address: '',
    phone: '',
    taxRate: 0,
    packagingFee: 2,
    currency: 'USD',
    tableCount: 10,
    receiptFooter: 'Thank you! Please come again. / អរគុណ!',
    createdAt: new Date(),
  });
  console.log('   ✅ Settings seeded');
}

async function seedManagerStaff() {
  console.log('👤 Setting up manager staff document...');
  console.log('   ⚠️  You need to:');
  console.log('      1. Go to Firebase Console → Authentication → Add user');
  console.log('      2. Create a user with your desired email/password');
  console.log('      3. Copy the UID and update the staff document');
  console.log('');
  console.log('   Creating placeholder manager document...');
  
  // Check if any staff exist
  const staffSnap = await getDocs(collection(db, 'staff'));
  if (staffSnap.empty) {
    // Create a placeholder - user should update UID after creating Auth account
    await setDoc(doc(db, 'staff', 'REPLACE_WITH_AUTH_UID'), {
      name: 'Manager',
      email: 'manager@restaurant.com',
      role: 'manager',
      active: true,
      createdAt: new Date(),
    });
    console.log('   ✅ Placeholder manager document created');
    console.log('   ⚠️  Replace the document ID with the actual Firebase Auth UID');
  } else {
    console.log('   ⏭️  Staff documents already exist, skipping');
  }
}

async function main() {
  console.log('🚀 Starting Firestore seed...\n');
  
  try {
    await seedMenu();
    await seedTables();
    await seedSettings();
    await seedManagerStaff();
    
    console.log('\n✅ Seed complete!');
    console.log('\nNext steps:');
    console.log('  1. Create a Firebase Auth user in the console');
    console.log('  2. Update the staff document ID to match the Auth UID');
    console.log('  3. Set up the .env file in foodmenu-pos with your Firebase config');
    console.log('  4. Run npm run dev to start the POS app');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
  }
  
  process.exit(0);
}

main();
