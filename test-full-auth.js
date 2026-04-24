const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgqiftublvrockxgzwzc.supabase.co';
const supabaseAnonKey = 'sb_publishable_7nsQ9F2C7ZlU8TtJTjVcfQ_ijOQQuRO';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  try {
    console.log('🧪 Testing signup...\n');

    const testEmail = `test-${Date.now()}@test.com`;
    const testPassword = 'test123';

    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('\n📤 Inserting user...');

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: testEmail,
        password: testPassword,
        role: 'host'
      }])
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Details:', error);
      process.exit(1);
    }

    console.log('✅ Signup successful!');
    console.log('User:', data[0]);

  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

testSignUp();
