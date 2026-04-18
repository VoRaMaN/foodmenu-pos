/**
 * Interactive Setup Script: One-command POS setup
 * 
 * Run: node scripts/setup.mjs
 * 
 * This script:
 *   1. Prompts for Firebase config → creates .env
 *   2. Prompts for manager email/password → creates Firebase Auth user + staff doc
 *   3. Seeds menu items, tables, and settings
 */

import { createInterface } from 'readline';
import { writeFileSync, existsSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n🚀 Khmer POS — Interactive Setup\n');
  console.log('Before running this script, you need to:');
  console.log('  1. Create a Firebase project at https://console.firebase.google.com');
  console.log('  2. Enable Email/Password Authentication');
  console.log('  3. Create a Firestore Database (production mode)');
  console.log('  4. Enable Storage (production mode)');
  console.log('  5. Add a Web app and copy the config values\n');

  // Step 1: Firebase config
  console.log('━━━ Step 1: Firebase Configuration ━━━\n');

  let config = {};
  if (existsSync(envPath)) {
    const useExisting = await ask('.env file already exists. Use it? (y/n): ');
    if (useExisting.toLowerCase() === 'y') {
      const { config: dotenv } = await import('dotenv');
      dotenv({ path: envPath });
      config = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
      };
      console.log(`   Using project: ${config.projectId}\n`);
    }
  }

  if (!config.projectId) {
    console.log('Enter your Firebase config values:\n');
    config.apiKey = await ask('  API Key: ');
    config.authDomain = await ask('  Auth Domain (e.g. myapp.firebaseapp.com): ');
    config.projectId = await ask('  Project ID: ');
    config.storageBucket = await ask('  Storage Bucket (e.g. myapp.appspot.com): ');
    config.messagingSenderId = await ask('  Messaging Sender ID: ');
    config.appId = await ask('  App ID: ');

    if (!config.projectId || !config.apiKey) {
      console.error('\n❌ API Key and Project ID are required.');
      process.exit(1);
    }

    // Write .env
    const envContent = `VITE_FIREBASE_API_KEY=${config.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain}
VITE_FIREBASE_PROJECT_ID=${config.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
VITE_FIREBASE_APP_ID=${config.appId}
`;
    writeFileSync(envPath, envContent);
    console.log('\n   ✅ .env file created\n');
  }

  // Initialize Firebase
  const app = initializeApp(config);
  const db = getFirestore(app);
  const authInstance = getAuth(app);

  // Step 2: Manager account
  console.log('━━━ Step 2: Manager Account ━━━\n');

  const managerEmail = await ask('  Manager email: ');
  const managerPassword = await ask('  Manager password (min 6 chars): ');

  if (!managerEmail || managerPassword.length < 6) {
    console.error('\n❌ Valid email and password (6+ chars) required.');
    process.exit(1);
  }

  let managerUid;
  try {
    const userCred = await createUserWithEmailAndPassword(authInstance, managerEmail, managerPassword);
    managerUid = userCred.user.uid;
    console.log(`   ✅ Auth user created (UID: ${managerUid})\n`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('   ⚠️  Email already exists, signing in...');
      try {
        const userCred = await signInWithEmailAndPassword(authInstance, managerEmail, managerPassword);
        managerUid = userCred.user.uid;
        console.log(`   ✅ Signed in (UID: ${managerUid})\n`);
      } catch (signInErr) {
        console.error(`\n❌ Could not sign in: ${signInErr.message}`);
        process.exit(1);
      }
    } else {
      console.error(`\n❌ Failed to create user: ${err.message}`);
      process.exit(1);
    }
  }

  // Create manager staff document
  await setDoc(doc(db, 'staff', managerUid), {
    name: 'Manager',
    email: managerEmail,
    role: 'manager',
    active: true,
    createdAt: new Date(),
  });
  console.log('   ✅ Manager staff document created\n');

  // Step 3: Seed data
  console.log('━━━ Step 3: Seed Database ━━━\n');

  // Seed menu items
  console.log('📋 Seeding menu items...');
  try {
    const { MENU_ITEMS } = await import('../../foodmenu/src/menuItems.js');
    const items = MENU_ITEMS.map((item) => ({
      ...item,
      available: true,
      sortOrder: item.id,
      createdAt: new Date(),
    }));
    for (const item of items) {
      await setDoc(doc(db, 'menu', `item_${item.id}`), item);
    }
    console.log(`   ✅ ${items.length} menu items seeded`);
  } catch (err) {
    console.error(`   ❌ Menu seed failed: ${err.message}`);
    console.log('   (Make sure the foodmenu project is at ../foodmenu/)');
  }

  // Seed tables
  console.log('🪑 Seeding tables...');
  for (let i = 1; i <= 10; i++) {
    await setDoc(doc(db, 'tables', `table_${i}`), {
      number: i,
      name: `Table ${i}`,
      status: 'available',
      currentOrderId: null,
      capacity: i <= 4 ? 4 : i <= 8 ? 6 : 8,
      createdAt: new Date(),
    });
  }
  console.log('   ✅ 10 tables seeded');

  // Seed settings
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

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Setup complete!\n');
  console.log('Next steps:');
  console.log(`  1. Deploy Firestore rules: firebase deploy --only firestore:rules`);
  console.log(`  2. Start the app: npm run dev`);
  console.log(`  3. Log in with: ${managerEmail}`);
  console.log(`  4. Go to Admin → Staff to create cashier/waiter/kitchen accounts`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
