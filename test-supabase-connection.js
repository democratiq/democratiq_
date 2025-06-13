// Test Supabase connection and check tasks table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ijvuxlkzfywfxcawebjg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdnV4bGt6Znl3ZnhjYXdlYmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTMzNDQsImV4cCI6MjA2NTE4OTM0NH0.sJNWRCTFGBiS5pZN2ee29WAiRERJAxHbhDHkEfbCfqY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Check if we can query the tasks table
  console.log('\n1. Testing SELECT on tasks table:');
  const { data: selectData, error: selectError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);
  
  if (selectError) {
    console.error('SELECT Error:', selectError);
  } else {
    console.log('SELECT Success! Found', selectData?.length || 0, 'tasks');
  }
  
  // Test 2: Try to insert a task
  console.log('\n2. Testing INSERT on tasks table:');
  const testTask = {
    title: 'Test Task from API',
    description: 'Testing if insert works',
    status: 'open',
    priority: 'medium',
    source: 'qr_code',
    grievance_type: 'general',
    voter_name: 'Test User',
    voter_phone: '+91 9999999999',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('tasks')
    .insert([testTask])
    .select()
    .single();
  
  if (insertError) {
    console.error('INSERT Error:', insertError);
    console.error('Error details:', {
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code
    });
  } else {
    console.log('INSERT Success! Created task with ID:', insertData.id);
    
    // Clean up - delete the test task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('Failed to clean up test task:', deleteError);
    } else {
      console.log('Test task cleaned up successfully');
    }
  }
  
  // Test 3: Check table schema
  console.log('\n3. Checking tasks table exists:');
  const { data: tables, error: tablesError } = await supabase
    .from('tasks')
    .select('*')
    .limit(0);
  
  if (tablesError) {
    console.error('Table check error:', tablesError);
  } else {
    console.log('Tasks table exists and is accessible');
  }
}

testConnection().catch(console.error);