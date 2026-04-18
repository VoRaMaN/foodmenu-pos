/**
 * Seed Script: Populate Supabase with menu, tables, and settings
 * 
 * Usage:
 *   1. Create a .env file with your Supabase config (see .env.example)
 *   2. Run the SQL from supabase/schema.sql in the Supabase SQL Editor
 *   3. Run: node scripts/seedData.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = join(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
} catch {
  console.error('❌ .env file not found. Create one from .env.example');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase config not found. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import menu items from the customer app
let MENU_ITEMS = [];
try {
  const mod = await import('../../foodmenu/src/menuItems.js');
  MENU_ITEMS = mod.MENU_ITEMS || [];
} catch {
  console.warn('⚠️  Could not import menu items from customer app.');
}

async function seedMenu() {
  if (MENU_ITEMS.length === 0) {
    console.log('📋 No menu items to seed (customer app not found)');
    return;
  }

  console.log('📋 Seeding menu items...');
  const items = MENU_ITEMS.map((item, idx) => ({
    name: item.name,
    name_kh: item.nameKh || '',
    category: item.category || 'Food',
    price: item.price,
    image: item.image || '',
    description: item.description || '',
    ingredients: item.ingredients || [],
    available: true,
    sort_order: idx,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('menu').insert(items);
  if (error) {
    console.error('   ❌ Menu seed failed:', error.message);
  } else {
    console.log(`   ✅ ${items.length} menu items seeded`);
  }
}

async function seedTables() {
  console.log('🪑 Seeding tables...');
  const tables = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    name: `Table ${i + 1}`,
    status: 'available',
    current_order_id: null,
    capacity: i < 4 ? 4 : i < 8 ? 6 : 8,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('tables').insert(tables);
  if (error) {
    console.error('   ❌ Tables seed failed:', error.message);
  } else {
    console.log('   ✅ 10 tables seeded');
  }
}

async function seedSettings() {
  console.log('⚙️  Seeding settings...');
  const { error } = await supabase.from('settings').upsert({
    id: 'restaurant',
    value: {
      restaurantName: 'Khmer Surin Restaurant',
      address: '',
      phone: '',
      taxRate: 0,
      packagingFee: 2,
      currency: 'USD',
      tableCount: 10,
      receiptFooter: 'Thank you! Please come again. / អរគុណ!',
    },
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('   ❌ Settings seed failed:', error.message);
  } else {
    console.log('   ✅ Settings seeded');
  }
}

async function main() {
  console.log('🚀 Starting Supabase seed...\n');

  await seedMenu();
  await seedTables();
  await seedSettings();

  console.log('\n✅ Seed complete!');
  console.log('\nNext steps:');
  console.log('  1. Run the setup script to create a manager: node scripts/setup.mjs');
  console.log('  2. Run: npm run dev');
  process.exit(0);
}

main();
