import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteFile, deleteStudentSubject, deleteStudentTest, deleteStudentTestFile } from '@/lib/fileService';

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

        const { type, studentCode, subject, chapter, filename, testName, studentName } = await request.json();

        if (!studentCode) {
             return NextResponse.json({ error: 'studentCode is required' }, { status: 400 });
        }

        switch (type) {
            case 'file':
                if (!subject || !chapter || !filename) {
                    return NextResponse.json({ error: 'subject, chapter and filename are required for file deletion' }, { status: 400 });
                }
                const sanitizedName = studentName?.replace(/\s+/g, '') || 'Student';
                const fileUrl = `/storage/students/${sanitizedName}_${studentCode}/subjects/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}/${filename}`;
                
                await deleteFile(studentCode, subject, chapter, filename, studentName);
                
                // Sync Database by exact URL
                await supabase.from('study_materials')
                    .delete()
                    .eq('url', fileUrl);
                break;
            case 'subject':
                if (!subject) {
                    return NextResponse.json({ error: 'subject is required for subject deletion' }, { status: 400 });
                }
                await deleteStudentSubject(studentCode, subject, studentName);

                // Sync Database by matching subject path in URL
                // We match both studentCode and subject in the URL string
                await supabase.from('study_materials')
                    .delete()
                    .ilike('url', `%_${studentCode}/subjects/${encodeURIComponent(subject)}/%`);
                break;
            case 'test-file':
                if (!testName || !filename) {
                    return NextResponse.json({ error: 'testName and filename are required for test-file deletion' }, { status: 400 });
                }
                await deleteStudentTestFile(studentCode, testName, filename, studentName);
                break;
            case 'test':
                if (!testName) {
                    return NextResponse.json({ error: 'testName is required for test deletion' }, { status: 400 });
                }
                await deleteStudentTest(studentCode, testName, studentName);
                break;
            default:
                return NextResponse.json({ error: 'Invalid deletion type' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `${type} deleted successfully` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
