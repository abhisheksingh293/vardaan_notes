export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { renameSubject } from '@/lib/fileService';

async function checkAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
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
