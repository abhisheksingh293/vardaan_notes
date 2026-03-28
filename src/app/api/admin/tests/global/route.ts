import { NextResponse } from 'next/server';
import { getGlobalTestTree } from '@/lib/fileService';

export async function GET() {
    try {
        const testTree = await getGlobalTestTree();
        return NextResponse.json(testTree);
    } catch (error: any) {
        console.error(`[API Global Tests] Error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
