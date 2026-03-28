import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createStudentFolder, createFile } from '@/lib/fileService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const { studentCode, studentName, isNewUser, subject, chapter } = await request.json();

        // 1. Manage Physical Storage
        if (isNewUser) {
            await createStudentFolder(studentCode, studentName);
        }

        if (subject && chapter) {
            const defaultFiles = ['notes.html', 'worksheet.html', 'quiz.html', 'solution.html'];
            for (const file of defaultFiles) {
                await createFile(studentCode, subject, chapter, file, undefined, studentName);
            }
        }

        // 2. Manage Dashboard Link Registry (study_materials)
        // Rule: Only add for Class <= 8, one-time only
        if (studentCode && studentName) {
            // Fetch student's class
            const { data: student } = await supabase
                .from('students')
                .select('class')
                .eq('student_code', studentCode)
                .single();

            const studentClass = student?.class || 'N/A';
            const classLevel = parseInt(studentClass);

            if (!isNaN(classLevel) && classLevel <= 8) {
                const sanitizedName = studentName?.replace(/\s+/g, '') || 'Student';
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                const dashboardUrl = `${baseUrl}/student/${sanitizedName}_${studentCode}`;

                // Check for existing link to prevent duplicates
                const { data: existingLink } = await supabase
                    .from('study_materials')
                    .select('id')
                    .eq('url', dashboardUrl)
                    .limit(1);

                if (!existingLink || existingLink.length === 0) {
                    await supabase.from('study_materials').insert({
                        class: studentClass,
                        subject: 'Dashboard',
                        chapter: 'Portal',
                        type: 'link',
                        title: `Dashboard: ${studentName}`,
                        url: dashboardUrl
                    });
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Scaffolded successfully (Dashboard Link Indexed if Class <= 8)' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
