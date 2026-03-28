export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renameSubjectGlobally, updateGlobalSubjectName } from '@/lib/fileService';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkAuth(request: Request) {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    return user;
}

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const user = await checkAuth(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { board, oldName, newName } = await request.json();
        if (!board || !oldName || !newName) {
             return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 1. Update Config File via Service
        await updateGlobalSubjectName(board, oldName, newName);

        // 2. Fetch all students for this board
        const { data: students, error: studentError } = await supabaseAdmin
            .from('students')
            .select('student_code')
            .ilike('board', `%${board}%`);

        if (studentError) throw studentError;

        if (!students || students.length === 0) {
            return NextResponse.json({ success: true, message: 'Updated config, but no students found for this board.' });
        }

        // 3. Trigger Global Rename on File System
        const studentCodes = students.map(s => s.student_code);
        const renameResults = await renameSubjectGlobally(studentCodes, oldName, newName);

        const summary = {
            total: studentCodes.length,
            success: renameResults.filter(r => r.success).length,
            errors: renameResults.filter(r => r.error).length
        };

        return NextResponse.json({ 
            success: true, 
            message: `Renamed ${oldName} to ${newName} for ${summary.success}/${summary.total} students.`,
            summary 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
