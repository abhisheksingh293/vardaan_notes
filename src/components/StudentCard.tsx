import Link from 'next/link';
import { User, School, BookOpen } from 'lucide-react';

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  class: string;
  board: string;
  school: string;
  profile_image_url?: string;
  mobile_number?: string;
  city?: string;
  state?: string;
  fee?: number;
  email?: string;
  father_name?: string;
}

export default function StudentCard({ student }: { student: Student }) {
  const studentUrl = `/student/${student.full_name ? student.full_name.trim().replace(/[^a-zA-Z0-9]/g, '') + '_' : ''}${student.student_code || ''}`;
  
  return (
    <div className="group relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-200 hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300">
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {student.profile_image_url ? (
            <img src={student.profile_image_url} alt="Profile" className="h-16 w-16 rounded-3xl object-cover shadow-sm border border-zinc-100" />
          ) : (
            <div className="h-16 w-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 uppercase">
              {(student.full_name || '?').charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
             <h3 className="text-xl font-black text-zinc-900 leading-tight line-clamp-1 uppercase tracking-tight">{student.full_name || 'Anonymous'}</h3>
             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
               {student.student_code || 'UNREGISTERED'}
             </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner group-hover:bg-blue-50 transition-colors">
            <BookOpen className="w-5 h-5 text-zinc-500 group-hover:text-blue-500" />
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Curriculum</span>
             <span className="text-sm font-bold text-zinc-700 leading-none">Class {student.class || '-'} • {student.board || '-'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner group-hover:bg-indigo-50 transition-colors">
            <School className="w-5 h-5 text-zinc-500 group-hover:text-indigo-500" />
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Institution</span>
             <span className="text-sm font-bold text-zinc-700 leading-none line-clamp-1">{student.school || 'Private Student'}</span>
          </div>
        </div>
      </div>

      <Link 
        href={studentUrl}
        className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white font-black text-sm rounded-[1.5rem] shadow-lg shadow-blue-500/20 active:bg-blue-700 hover:bg-blue-700 uppercase tracking-widest transition-all"
      >
        View Profile
      </Link>
    </div>
  );
}
