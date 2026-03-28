export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getFullFolderTree } from '@/lib/fileService';

export async function GET(
    request: Request, 
    { params }: { params: Promise<{ studentCode: string }> }
) {
    try {
        const { studentCode } = await params;
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name') || undefined;
        
        const treeData = await getFullFolderTree(studentCode, name);
        return NextResponse.json(treeData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
