const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgqiftublvrockxgzwzc.supabase.co';
const supabaseAnonKey = 'sb_publishable_7nsQ9F2C7ZlU8TtJTjVcfQ_ijOQQuRO';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullFlow() {
  try {
    console.log('🚀 Testing full auth flow\n');

    // Test 1: Signup
    const testEmail = `user-${Date.now()}@test.com`;
    const testPassword = 'mypassword123';

    console.log('1️⃣ Signup Test');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('   Role: host');

    const { data: signupData, error: signupError } = await supabase
      .from('users')
      .insert([{ email: testEmail, password: testPassword, role: 'host' }])
      .select()
      .single();

    if (signupError) {
      console.log('   ❌ Signup failed:', signupError.message);
      process.exit(1);
    }

    console.log('   ✅ Signup success!');
    console.log('   User ID:', signupData.id);
    console.log('   Role:', signupData.role);

    // Test 2: Login (find user by email and check password)
    console.log('\n2️⃣ Login Test');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);

    const { data: loginData, error: loginError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (loginError) {
      console.log('   ❌ User not found:', loginError.message);
      process.exit(1);
    }

    if (loginData.password !== testPassword) {
      console.log('   ❌ Password incorrect');
      process.exit(1);
    }

    console.log('   ✅ Login success!');
    console.log('   User ID:', loginData.id);
    console.log('   Role:', loginData.role);

    // Test 3: Guest signup
    console.log('\n3️⃣ Guest Signup Test');
    const guestEmail = `guest-${Date.now()}@test.com`;
    const { data: guestData, error: guestError } = await supabase
      .from('users')
      .insert([{ email: guestEmail, password: 'guest123', role: 'guest' }])
      .select()
      .single();

    if (guestError) {
      console.log('   ❌ Guest signup failed:', guestError.message);
      process.exit(1);
    }

    console.log('   ✅ Guest signup success!');
    console.log('   Email:', guestEmail);
    console.log('   Role:', guestData.role);

    console.log('\n✅ All tests passed! Auth is working!\n');

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

testFullFlow();
