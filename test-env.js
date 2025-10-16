// Test environment variables loading
require('dotenv').config({ path: '.env.local' });

console.log('=== ENVIRONMENT TEST ===');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('NEXT_PUBLIC_WHOP_COMPANY_ID:', process.env.NEXT_PUBLIC_WHOP_COMPANY_ID);
console.log('All env vars with MONGO:', Object.keys(process.env).filter(k => k.includes('MONGO')));
console.log('All env vars with WHOP:', Object.keys(process.env).filter(k => k.includes('WHOP')));
