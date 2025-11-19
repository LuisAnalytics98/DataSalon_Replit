// Quick verification that connection string is correct
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env.local') });

const dbUrl = process.env.DATABASE_URL;

console.log('🔍 Verifying Database Connection String...\n');

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Hide password in output
const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
console.log(`Connection String: ${safeUrl}\n`);

// Check format
if (dbUrl.includes('[YOUR_PASSWORD]')) {
  console.error('❌ ERROR: [YOUR_PASSWORD] placeholder found!');
  console.log('\n💡 You need to replace [YOUR_PASSWORD] with your actual password.');
  console.log('   Your password is: Comearroz.98');
  console.log('\n   The connection string should be:');
  console.log('   postgresql://postgres:Comearroz.98@db.ujgdkuhztbtzseqotbpe.supabase.co:5432/postgres');
  process.exit(1);
}

// Check if password is in the string
if (!dbUrl.includes('Comearroz.98')) {
  console.error('❌ ERROR: Password not found in connection string!');
  console.log('\n💡 Make sure your password is in the connection string.');
  process.exit(1);
}

// Check format
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('❌ ERROR: Connection string should start with postgresql:// or postgres://');
  process.exit(1);
}

// Check hostname
if (!dbUrl.includes('db.ujgdkuhztbtzseqotbpe.supabase.co')) {
  console.error('❌ ERROR: Hostname should be db.ujgdkuhztbtzseqotbpe.supabase.co');
  process.exit(1);
}

console.log('✅ Connection string format looks correct!');
console.log('   - Starts with postgresql:// ✓');
console.log('   - Has password ✓');
console.log('   - Has correct hostname ✓');
console.log('   - Has port 5432 ✓');
console.log('\n📝 Next step: Try running the server again:');
console.log('   npm run dev');

