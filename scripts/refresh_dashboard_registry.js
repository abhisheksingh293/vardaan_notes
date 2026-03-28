
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

async function refreshRegistry() {
  console.log('🚀 Resetting Study Materials Table to Dashboard-only Registry (Class <= 8)...');

  try {
    // 1. Wipe everything
    const { error: dError } = await supabase.from('study_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (dError) throw dError;
    console.log('🧹 Table cleared.');

    // 2. Fetch students
    const { data: students, error: sError } = await supabase.from('students').select('*');
    if (sError) throw sError;

    let addedCount = 0;
    const insertPayloads = [];

    for (const student of students) {
      const classLevel = parseInt(student.class);
      if (isNaN(classLevel) || classLevel > 8) continue;

      const sanitizedName = student.full_name?.replace(/\s+/g, '') || 'Student';
      const dashboardUrl = `http://localhost:3000/student/${sanitizedName}_${student.student_code}`;

      insertPayloads.push({
        class: student.class || 'N/A',
        subject: 'Dashboard',
        chapter: 'Portal',
        type: 'link',
        title: `Dashboard: ${student.full_name}`,
        url: dashboardUrl
      });
      addedCount++;
    }

    if (insertPayloads.length > 0) {
      const { error: iError } = await supabase.from('study_materials').insert(insertPayloads);
      if (iError) throw iError;
    }

    console.log(`✅ Success! Populated registry with ${addedCount} dashboard links.`);
  } catch (err) {
    console.error('❌ Failed to refresh registry:', err);
  }
}

refreshRegistry();
