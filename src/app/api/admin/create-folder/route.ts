import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createStudentFolder } from '@/lib/fileService';

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

        const { studentCode, studentName } = await request.json();

        if (!studentCode) {
             return NextResponse.json({ error: 'studentCode is required' }, { status: 400 });
        }

        await createStudentFolder(studentCode, studentName);
        return NextResponse.json({ success: true, message: 'Folder verified/created' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
