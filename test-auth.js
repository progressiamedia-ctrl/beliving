// Test script to verify auth works
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgqiftublvrockxgzwzc.supabase.co';
const supabaseAnonKey = 'sb_publishable_7nsQ9F2C7ZlU8TtJTjVcfQ_ijOQQuRO';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  try {
    console.log('Testing signup...');

    // Create simple hash
    const password = 'test123';
    const hash = Buffer.from(password).toString('base64');

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: `test-${Date.now()}@test.com`,
        password: hash,
        role: 'host'
      }])
      .select();

    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }

    console.log('✅ Signup successful!', data);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testSignUp();
