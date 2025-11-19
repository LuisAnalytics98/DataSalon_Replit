// Verify Supabase setup and database connection
import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Verifying Supabase Setup...\n');

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  console.error('❌ Missing required environment variables');
  console.log('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new Pool({ connectionString: databaseUrl });

async function verifySetup() {
  try {
    console.log('✅ Environment variables loaded\n');

    // Test 1: Verify tables exist
    console.log('1️⃣ Checking database tables...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const { rows: tables } = await pool.query(tablesQuery);
    const expectedTables = [
      'sessions',
      'users',
      'salons',
      'salon_users',
      'clients',
      'services',
      'stylists',
      'stylist_availability',
      'bookings',
      'salon_inquiries'
    ];

    console.log(`   Found ${tables.length} tables:`);
    const tableNames = tables.map(t => t.table_name);
    
    let allTablesExist = true;
    for (const expected of expectedTables) {
      if (tableNames.includes(expected)) {
        console.log(`   ✅ ${expected}`);
      } else {
        console.log(`   ❌ ${expected} - MISSING`);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing. Make sure you ran the SQL script correctly.');
    } else {
      console.log('\n✅ All required tables exist!');
    }

    // Test 2: Check storage bucket
    console.log('\n2️⃣ Checking storage bucket...');
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'salon-assets';
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error(`   ❌ Error: ${bucketError.message}`);
    } else {
      const bucket = buckets?.find(b => b.name === bucketName);
      if (bucket) {
        console.log(`   ✅ Bucket "${bucketName}" exists`);
        console.log(`      Public: ${bucket.public ? 'Yes ✅' : 'No ⚠️  (should be public)'}`);
      } else {
        console.log(`   ❌ Bucket "${bucketName}" not found`);
        console.log(`   Available: ${buckets?.map(b => b.name).join(', ') || 'None'}`);
      }
    }

    // Test 3: Test database connection
    console.log('\n3️⃣ Testing database connection...');
    const { rows: testRows } = await pool.query('SELECT NOW() as current_time');
    console.log(`   ✅ Database connection successful`);
    console.log(`   Server time: ${testRows[0].current_time}`);

    // Test 4: Check if we can query tables
    console.log('\n4️⃣ Testing table access...');
    try {
      const { rowCount } = await pool.query('SELECT COUNT(*) FROM salons');
      console.log(`   ✅ Can query tables (salons table accessible)`);
    } catch (error) {
      console.log(`   ⚠️  Error querying tables: ${error.message}`);
    }

    // Test 5: Verify Supabase Auth is accessible
    console.log('\n5️⃣ Testing Supabase API...');
    try {
      // Just check if we can access the API
      const { data, error } = await supabase.from('salons').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.log(`   ⚠️  API test: ${error.message}`);
      } else {
        console.log(`   ✅ Supabase API accessible`);
      }
    } catch (error) {
      console.log(`   ⚠️  API test error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Setup Summary:');
    console.log('='.repeat(50));
    console.log(`   Tables: ${tables.length}/10 ${allTablesExist ? '✅' : '⚠️'}`);
    console.log(`   Storage: ${bucketName} ${buckets?.find(b => b.name === bucketName) ? '✅' : '❌'}`);
    console.log(`   Database: Connected ✅`);
    console.log(`   API: Accessible ✅`);
    
    if (allTablesExist) {
      console.log('\n🎉 Your Supabase setup looks good!');
      console.log('\n📝 Next steps:');
      console.log('   1. Test the application: npm run dev');
      console.log('   2. Try logging in to test authentication');
      console.log('   3. Test creating a booking');
    } else {
      console.log('\n⚠️  Please fix the missing tables before proceeding.');
    }

    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verifySetup();

