
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/krabh/OneDrive/Desktop/bbbbbbbbbbbbbbbbb/.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase.from('students').select().limit(1);
  if (error) {
    console.error('Error fetching students:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in students table:', Object.keys(data[0]));
  } else {
    console.log('No data found in students table.');
  }
}

checkSchema();
