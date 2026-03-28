import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMaterialCount, getTestCounts } from '@/lib/fileService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    // Globally rule out students from Class 9, 10, 11, and 12 across the entire application
    const baseFiltered = data?.filter((s: any) => {
       const className = (s.class || '').toLowerCase();
       return !className.includes('9') && !className.includes('10') && !className.includes('11') && !className.includes('12');
    }) || [];

    // Attach material and test counts
    const studentsWithCounts = await Promise.all(baseFiltered.map(async (student: any) => {
       // Optimized String Matching: Count materials by student identifier in URL
       const { count: dbMaterialCount } = await supabase
          .from('study_materials')
          .select('*', { count: 'exact', head: true })
          .ilike('url', `%_${student.student_code}/%`);

       const testCounts = await getTestCounts(student.student_code);

       // Reverting to on-the-fly dashboard_url calculation as per "No Database Change" rule
       const dashboardUrl = `/student/${student.full_name?.replace(/\s+/g, '')}_${student.student_code}`;

       return { 
          ...student, 
          material_count: dbMaterialCount || 0,
          minor_test_count: testCounts.minor,
          major_test_count: testCounts.major,
          dashboard_url: dashboardUrl
       };
    }));

    return NextResponse.json(studentsWithCounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
