export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getGlobalSubjects, updateGlobalSubjects } from '@/lib/fileService';

async function checkAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    return user;
}

export async function GET(request: Request) {
    try {
        const subjects = await getGlobalSubjects();
        return NextResponse.json(subjects);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await checkAuth(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { board, subjects } = await request.json();
        if (!board || !Array.isArray(subjects)) {
             return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const data = await updateGlobalSubjects(board, subjects);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
