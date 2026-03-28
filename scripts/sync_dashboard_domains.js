
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

async function syncDomains() {
  const newBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  console.log(`🚀 Syncing Dashboard Links to new domain: ${newBaseUrl}`);

  try {
    // 1. Fetch all dashboard links
    const { data: records, error: fError } = await supabase
      .from('study_materials')
      .select('id, url')
      .eq('type', 'link')
      .eq('subject', 'Dashboard');

    if (fError) throw fError;

    if (!records || records.length === 0) {
      console.log('✨ No dashboard links found to sync.');
      return;
    }

    let updateCount = 0;

    for (const record of records) {
      // Logic: Extract everything after /student/ and prepend newBaseUrl
      const urlParts = record.url.split('/student/');
      if (urlParts.length < 2) continue;

      const studentPath = urlParts[1];
      const newUrl = `${newBaseUrl}/student/${studentPath}`;

      if (record.url !== newUrl) {
          const { error: uError } = await supabase
            .from('study_materials')
            .update({ url: newUrl })
            .eq('id', record.id);
          
          if (uError) {
              console.error(`❌ Failed to update record ${record.id}:`, uError);
          } else {
              updateCount++;
          }
      }
    }

    console.log(`✅ Success! Updated ${updateCount} dashboard links to the current domain.`);
  } catch (err) {
    console.error('❌ Domain sync failed:', err);
  }
}

syncDomains();
