/**
 * Interactive Setup Script: One-command POS setup
 * 
 * Run: node scripts/setup.mjs
 * 
 * This script:
 *   1. Prompts for Supabase config → creates .env
 *   2. Prompts for manager email/password → creates user + staff record
 *   3. Seeds menu items, tables, and settings
 */

import { createInterface } from 'readline';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n🚀 Khmer POS — Interactive Setup\n');
  console.log('Before running this script, you need to:');
  console.log('  1. Create a Supabase project at https://supabase.com');
  console.log('  2. Go to Project Settings → API to get your URL and anon key');
  console.log('  3. Run the SQL from supabase/schema.sql in the SQL Editor\n');

  // Step 1: Supabase config
  console.log('━━━ Step 1: Supabase Configuration ━━━\n');

  let supabaseUrl, supabaseAnonKey;

  if (existsSync(envPath)) {
    const useExisting = await ask('.env file already exists. Use it? (y/n): ');
    if (useExisting.toLowerCase() === 'y') {
      const envContent = readFileSync(envPath, 'utf-8');
      const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
      const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
      supabaseUrl = urlMatch?.[1]?.trim();
      supabaseAnonKey = keyMatch?.[1]?.trim();
      console.log('  ✅ Using existing .env\n');
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Enter your Supabase credentials (from Project Settings → API):\n');
    supabaseUrl = await ask('  Supabase URL: ');
    supabaseAnonKey = await ask('  Supabase Anon Key: ');

    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl.trim()}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey.trim()}
`;
    writeFileSync(envPath, envContent);
    console.log('\n  ✅ .env file created\n');
  }

  // Validate connection
  const supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());

  console.log('  Testing connection...');
  const { error: pingError } = await supabase.from('settings').select('id').limit(1);
  if (pingError && !pingError.message.includes('does not exist')) {
    // Table might not exist yet, that's ok. Only fail on actual connection errors.
    if (pingError.message.includes('fetch') || pingError.message.includes('network')) {
      console.error('  ❌ Connection failed:', pingError.message);
      console.error('  Check your Supabase URL and anon key.');
      rl.close();
      process.exit(1);
    }
  }
  console.log('  ✅ Connected to Supabase\n');

  // Step 2: Manager account
  console.log('━━━ Step 2: Manager Account ━━━\n');
  const email = await ask('  Manager email: ');
  const password = await ask('  Manager password (min 6 chars): ');

  if (password.length < 6) {
    console.error('  ❌ Password must be at least 6 characters');
    rl.close();
    process.exit(1);
  }

  console.log('\n  Creating manager account...');
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) {
    console.error('  ❌ Auth error:', authError.message);
    rl.close();
    process.exit(1);
  }

  // Create staff record
  const { error: staffError } = await supabase.from('staff').insert({
    id: authData.user.id,
    name: 'Manager',
    email,
    role: 'manager',
    active: true,
    created_at: new Date().toISOString(),
  });
  if (staffError) {
    console.error('  ⚠️  Staff record error (may already exist):', staffError.message);
  } else {
    console.log('  ✅ Manager account created\n');
  }

  // Step 3: Seed data
  console.log('━━━ Step 3: Seed Data ━━━\n');
  const doSeed = await ask('  Seed menu items, tables, and settings? (y/n): ');

  if (doSeed.toLowerCase() === 'y') {
    // Import menu items
    let menuItems = [];
    try {
      const mod = await import('../../foodmenu/src/menuItems.js');
      menuItems = mod.MENU_ITEMS || [];
    } catch {
      console.log('  ⚠️  Could not import menu items from customer app. Skipping menu seed.');
    }

    if (menuItems.length > 0) {
      console.log(`  Seeding ${menuItems.length} menu items...`);
      const items = menuItems.map((item, idx) => ({
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
      if (error) console.error('  ⚠️  Menu seed error:', error.message);
      else console.log(`  ✅ ${items.length} menu items seeded`);
    }

    // Seed tables
    console.log('  Seeding tables...');
    const tables = Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      name: `Table ${i + 1}`,
      status: 'available',
      current_order_id: null,
      capacity: i < 4 ? 4 : i < 8 ? 6 : 8,
      created_at: new Date().toISOString(),
    }));
    const { error: tableError } = await supabase.from('tables').insert(tables);
    if (tableError) console.error('  ⚠️  Table seed error:', tableError.message);
    else console.log('  ✅ 10 tables seeded');

    // Seed settings
    console.log('  Seeding settings...');
    const { error: settingsError } = await supabase.from('settings').upsert({
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
    if (settingsError) console.error('  ⚠️  Settings seed error:', settingsError.message);
    else console.log('  ✅ Settings seeded');
  }

  console.log('\n━━━ Setup Complete! ━━━\n');
  console.log('Next steps:');
  console.log('  1. Make sure you ran supabase/schema.sql in Supabase SQL Editor');
  console.log('  2. Run: npm run dev');
  console.log('  3. Log in with your manager email and password\n');

  rl.close();
  process.exit(0);
}

main();
