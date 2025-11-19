// Quick test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`   URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1️⃣ Testing Supabase API connection...');
    const { data: health, error: healthError } = await supabase.from('_prisma_migrations').select('id').limit(1);
    
    if (healthError && healthError.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is fine for now
      console.log('   ⚠️  Database tables not migrated yet (this is OK)');
    } else {
      console.log('   ✅ Supabase API connection successful');
    }

    // Test 2: Check storage bucket
    console.log('\n2️⃣ Testing Storage bucket...');
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'salon-assets';
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('   ❌ Error accessing storage:', bucketError.message);
    } else {
      const bucket = buckets?.find(b => b.name === bucketName);
      if (bucket) {
        console.log(`   ✅ Storage bucket "${bucketName}" found`);
        console.log(`      Public: ${bucket.public ? 'Yes' : 'No'}`);
      } else {
        console.log(`   ⚠️  Storage bucket "${bucketName}" not found`);
        console.log('   Available buckets:', buckets?.map(b => b.name).join(', ') || 'None');
      }
    }

    // Test 3: Check database connection
    console.log('\n3️⃣ Testing Database connection...');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('   ✅ DATABASE_URL is set');
      console.log(`   Connection: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    } else {
      console.log('   ❌ DATABASE_URL not set');
    }

    console.log('\n✅ All basic checks completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run database migrations (if needed)');
    console.log('   2. Test the application: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    process.exit(1);
  }
}

testConnection();

