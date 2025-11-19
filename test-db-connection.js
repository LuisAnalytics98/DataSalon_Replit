// Test database connection
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'dns';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Testing Database Connection...\n');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set in .env.local');
  process.exit(1);
}

// Parse the connection string
const url = new URL(databaseUrl);
const hostname = url.hostname;

console.log(`Connection String: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
console.log(`Hostname: ${hostname}`);
console.log(`Port: ${url.port || '5432'}`);
console.log();

// Test DNS lookup
const lookup = promisify(dns.lookup);

async function testConnection() {
  try {
    console.log('1️⃣ Testing DNS lookup...');
    const result = await lookup(hostname);
    console.log(`   ✅ DNS resolved: ${hostname} → ${result.address}`);
  } catch (error) {
    console.error(`   ❌ DNS lookup failed: ${error.message}`);
    console.log('\n💡 Possible issues:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify the Supabase project is active (not paused)');
    console.log('   3. Check the connection string format in Supabase Dashboard');
    console.log('   4. Try using the connection pooler URL instead');
    process.exit(1);
  }

  // Test if we can parse the connection string
  try {
    console.log('\n2️⃣ Testing connection string format...');
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
      console.log('   ✅ Connection string format looks correct');
    } else {
      console.log('   ⚠️  Connection string should start with postgresql:// or postgres://');
    }
  } catch (error) {
    console.error(`   ❌ Error parsing connection string: ${error.message}`);
  }

  console.log('\n✅ Basic checks passed!');
  console.log('\n📝 Next steps:');
  console.log('   1. If DNS lookup failed, check Supabase Dashboard');
  console.log('   2. Get the connection string from: Settings > Database > Connection string');
  console.log('   3. Make sure to use the "URI" format, not "JDBC" or "Golang"');
}

testConnection();

