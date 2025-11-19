// Quick diagnostic script to check server status
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '.env.local') });

const port = parseInt(process.env.PORT || '5000', 10);
const url = `http://localhost:${port}`;

console.log('🔍 Checking server status...\n');
console.log(`Port: ${port}`);
console.log(`URL: ${url}\n`);

// Try to connect to the server
const req = http.get(url, (res) => {
  console.log(`✅ Server is running!`);
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   You can access it at: ${url}`);
  process.exit(0);
});

req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ Server is NOT running');
    console.log('\n📝 To start the server:');
    console.log('   1. Make sure you ran: npm install');
    console.log('   2. Then run: npm run dev');
    console.log('   3. Wait for "serving on port 5000" message');
  } else {
    console.log(`❌ Error: ${err.message}`);
  }
  process.exit(1);
});

req.setTimeout(3000, () => {
  console.log('⏱️  Connection timeout - server might not be running');
  req.destroy();
  process.exit(1);
});

