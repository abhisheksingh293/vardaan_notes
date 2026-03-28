
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic .env parser
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

// Configuration
const STORAGE_PATH = path.join(__dirname, '..', 'client', 'public', 'storage', 'students');

async function sync() {
  console.log('🚀 Starting Zero-Dependency Filesystem to DB Sync...');

  try {
    const { data: students, error: sError } = await supabase.from('students').select('*');
    if (sError) throw sError;

    const studentMap = new Map();
    students.forEach(s => studentMap.set(s.student_code, s));

    if (!fs.existsSync(STORAGE_PATH)) {
      console.error('❌ Storage path does not exist:', STORAGE_PATH);
      return;
    }

    const studentFolders = fs.readdirSync(STORAGE_PATH);
    let totalSynced = 0;

    for (const folder of studentFolders) {
      if (folder === '.gitkeep' || folder === 'temp') continue;

      const folderPath = path.join(STORAGE_PATH, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      const parts = folder.split('_');
      const studentCode = parts[parts.length - 1];
      const student = studentMap.get(studentCode);

      if (!student) continue;

      const studentClass = student.class || 'N/A';
      const classLevel = parseInt(studentClass);

      // Filter: Only sync for Class 8 and below
      if (!isNaN(classLevel) && classLevel > 8) {
          console.log(`⏭️ Skipping ${student.full_name} (${studentClass}): Class > 8`);
          continue;
      }

      console.log(`📂 Syncing ${student.full_name} (${studentCode})...`);

      const subjectsDir = path.join(folderPath, 'subjects');
      if (!fs.existsSync(subjectsDir)) continue;

      const subjects = fs.readdirSync(subjectsDir);
      for (const subject of subjects) {
        const subjectPath = path.join(subjectsDir, subject);
        if (!fs.statSync(subjectPath).isDirectory()) continue;

        const chapters = fs.readdirSync(subjectPath);
        for (const chapter of chapters) {
          const chapterPath = path.join(subjectPath, chapter);
          if (!fs.statSync(chapterPath).isDirectory()) continue;

          const files = fs.readdirSync(chapterPath);
          const insertPayloads = [];

            for (const file of files) {
              if (!file.endsWith('.html')) continue;

              const type = file.split('.')[0];
              const title = type.charAt(0).toUpperCase() + type.slice(1);
              const url = `/storage/students/${folder}/subjects/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}/${file}`;

              insertPayloads.push({
                // student_code omitted as it is not in the DB
                class: student.class || 'N/A',
                subject: subject,
                chapter: chapter,
                type: type,
                title: `${title}: ${chapter}`,
                url: url
              });
              totalSynced++;
            }

            if (insertPayloads.length > 0) {
              // Delete existing by URL to simulate upsert
              for (const payload of insertPayloads) {
                  await supabase.from('study_materials').delete().eq('url', payload.url);
              }
              await supabase.from('study_materials').insert(insertPayloads);
            }
        }
      }
    }

    console.log(`✅ Success! Synced ${totalSynced} items.`);
  } catch (err) {
    console.error('❌ Sync failed:', err);
  }
}

sync();
