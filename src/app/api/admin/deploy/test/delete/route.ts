import { NextResponse } from 'next/server';
import { permanentlyDeleteTest } from '@/lib/fileService';

export async function POST(request: Request) {
    try {
        const { testName, studentCodes } = await request.json();
        
        if (!testName || !studentCodes || !Array.isArray(studentCodes)) {
            return NextResponse.json({ error: 'Invalid parameters. Need testName and studentCodes array' }, { status: 400 });
        }

        const result = await permanentlyDeleteTest(testName, studentCodes);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error(`[API Test Delete] Error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
