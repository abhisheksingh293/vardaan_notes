import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createFile } from '@/lib/fileService';

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

        const { studentCode, subject, chapter, filename, content, studentName } = await request.json();

        if (!studentCode || !subject || !chapter || !filename) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Manage Physical Storage
        await createFile(studentCode, subject, chapter, filename, content, studentName);

        const { data: student } = await supabase
            .from('students')
            .select('class')
            .eq('student_code', studentCode)
            .single();

        const studentClass = student?.class || 'N/A';
        const classLevel = parseInt(studentClass);

        // Filesystem operation only - Database indexing removed as per Dashboard-only Registry pivot
        return NextResponse.json({ success: true, message: 'File generated successfully (Filesystem only)' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
