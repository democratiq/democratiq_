// Check the actual schema of the tasks table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ijvuxlkzfywfxcawebjg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdnV4bGt6Znl3ZnhjYXdlYmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTMzNDQsImV4cCI6MjA2NTE4OTM0NH0.sJNWRCTFGBiS5pZN2ee29WAiRERJAxHbhDHkEfbCfqY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking tasks table schema...\n');
  
  // Get one row to see what columns exist
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns in tasks table:');
    const columns = Object.keys(data[0]);
    columns.forEach(col => {
      const value = data[0][col];
      const type = value === null ? 'null' : typeof value;
      console.log(`- ${col} (${type}): ${JSON.stringify(value)}`);
    });
    
    console.log('\nTotal columns:', columns.length);
    console.log('\nColumn names:', columns.join(', '));
  } else {
    console.log('No data found in tasks table');
    
    // Try to insert minimal data to see what's required
    console.log('\nTrying minimal insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('tasks')
      .insert([{ title: 'Test' }])
      .select();
    
    if (insertError) {
      console.error('Minimal insert error:', insertError);
    }
  }
}

checkSchema().catch(console.error);