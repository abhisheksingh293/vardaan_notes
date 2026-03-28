import { NextResponse } from 'next/server';
import { deployAutoTest } from '@/lib/fileService';

export async function POST(request: Request) {
    try {
        const { type, studentCodes } = await request.json();
        
        if (!type || !studentCodes || !Array.isArray(studentCodes)) {
            return NextResponse.json({ error: 'Invalid parameters. Need type (Minor/Major) and studentCodes array' }, { status: 400 });
        }

        const result = await deployAutoTest(type, studentCodes);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error(`[API Test Deploy] Error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
