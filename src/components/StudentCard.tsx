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
  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125" />
      
      <div className="relative flex items-center justify-between mb-4">
        {student.profile_image_url ? (
          <img src={student.profile_image_url} alt="Profile" className="h-16 w-16 rounded-full object-cover shadow-inner border border-zinc-200 dark:border-zinc-700" />
        ) : (
          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner uppercase">
            {(student.full_name || '?').charAt(0)}
          </div>
        )}
        <span className="text-xs font-semibold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full border border-zinc-200 dark:border-zinc-700">
          {student.student_code || 'N/A'}
        </span>
      </div>

      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{student.full_name || 'Unknown Student'}</h3>
      
      <div className="space-y-2 mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Class {student.class || '-'} • {student.board || '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="line-clamp-1">{student.school || 'No School Recorded'}</span>
        </div>
        {(student.mobile_number || student.email) && (
           <div className="flex items-center gap-2 text-xs pt-1">
             <User className="w-4 h-4 text-teal-500 shrink-0" />
             <span className="line-clamp-1">{student.mobile_number || student.email}</span>
           </div>
        )}
        {(student.city || student.state) && (
           <div className="flex items-center gap-2 text-xs">
             <span className="ml-6 line-clamp-1 text-zinc-500">{[student.city, student.state].filter(Boolean).join(', ')}</span>
           </div>
        )}
      </div>

      <div className="mt-6">
        <Link 
          href={`/student/${student.full_name ? student.full_name.trim().replace(/[^a-zA-Z0-9]/g, '') + '_' : ''}${student.student_code || ''}`}
          className="block w-full text-center py-2.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  );
}
