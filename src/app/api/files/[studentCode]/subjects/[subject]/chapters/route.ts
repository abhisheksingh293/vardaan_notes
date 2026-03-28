export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/fileService';

export async function GET(
    request: Request, 
    { params }: { params: Promise<{ studentCode: string, subject: string }> }
) {
    try {
        const { studentCode, subject } = await params;
        const chapters = await getChapters(studentCode, decodeURIComponent(subject));
        return NextResponse.json(chapters);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
