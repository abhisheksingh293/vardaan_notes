
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

loadEnv(path.join(__dirname, '..', 'client', '.env'));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanup() {
  console.log('🧹 Cleaning up high school materials (Class > 8)...');

  try {
    // 1. Fetch all unique classes in study_materials
    const { data: records, error: rError } = await supabase.from('study_materials').select('id, class');
    if (rError) throw rError;

    const idsToDelete = records
      .filter(r => {
        const classLevel = parseInt(r.class);
        return !isNaN(classLevel) && classLevel > 8;
      })
      .map(r => r.id);

    if (idsToDelete.length === 0) {
      console.log('✨ No high school materials found to delete.');
      return;
    }

    console.log(`🗑️ Deleting ${idsToDelete.length} records...`);
    
    // Supabase can delete by array of IDs
    const { error: dError } = await supabase
      .from('study_materials')
      .delete()
      .in('id', idsToDelete);

    if (dError) throw dError;

    console.log('✅ Cleanup successful.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
  }
}

cleanup();
