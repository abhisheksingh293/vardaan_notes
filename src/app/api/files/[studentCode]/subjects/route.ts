export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSubjects } from '@/lib/fileService';

export async function GET(request: Request, { params }: { params: Promise<{ studentCode: string }> }) {
    try {
        const { studentCode } = await params;
        const subjects = await getSubjects(studentCode);
        return NextResponse.json(subjects);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
