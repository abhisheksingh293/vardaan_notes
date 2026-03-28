export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renameSubject } from '@/lib/fileService';

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
        const user = await checkAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { studentCode, oldName, newName } = await request.json();

        if (!studentCode || !oldName || !newName) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await renameSubject(studentCode, oldName, newName);
        return NextResponse.json({ success: true, message: `Renamed subject from ${oldName} to ${newName}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
