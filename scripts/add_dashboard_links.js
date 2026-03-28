
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

async function addDashboardLinks() {
  console.log('🚀 Adding Student Dashboard links to study_materials...');

  try {
    const { data: students, error: sError } = await supabase.from('students').select('*');
    if (sError) throw sError;

    let addedCount = 0;

    for (const student of students) {
      const sanitizedName = student.full_name?.replace(/\s+/g, '') || 'Student';
      const dashboardUrl = `http://localhost:3000/student/${sanitizedName}_${student.student_code}`;

      // Check if already exists in study_materials by URL
      const { data: existing } = await supabase
        .from('study_materials')
        .select('id')
        .eq('url', dashboardUrl)
        .limit(1);

      if (!existing || existing.length === 0) {
        console.log(`➕ Adding dashboard link for: ${student.full_name}`);
        
        await supabase.from('study_materials').insert({
          class: student.class || 'N/A',
          subject: 'Dashboard',
          chapter: 'Portal',
          type: 'link',
          title: `Dashboard: ${student.full_name}`,
          url: dashboardUrl
        });
        addedCount++;
      } else {
        console.log(`⏭️ Dashboard link already exists for: ${student.full_name}`);
      }
    }

    console.log(`✅ Success! Added ${addedCount} new dashboard links.`);
  } catch (err) {
    console.error('❌ Failed to add dashboard links:', err);
  }
}

addDashboardLinks();
