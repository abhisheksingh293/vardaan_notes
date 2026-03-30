"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import StudentCard from '@/components/StudentCard';

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  class: string;
  board: string;
  school: string;
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/api/students');
        setStudents(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch students. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col items-center text-center gap-6 mt-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-900 uppercase">
              Vardaan <span className="text-blue-600">Comet</span>
            </h1>
            <p className="text-sm md:text-lg text-zinc-500 font-bold uppercase tracking-[0.3em]">Learning Portal</p>
          </div>
          <div className="flex gap-4">
            <a href="/admin" className="px-8 py-3 bg-white border border-zinc-200 text-zinc-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-50 shadow-sm transition-all">
              Admin Access
            </a>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Loading Students</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 flex flex-col items-center text-center max-w-md mx-auto">
            <span className="font-black uppercase tracking-widest mb-2">Sync Error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 bg-white rounded-[3rem] border border-dashed border-zinc-200 shadow-inner max-w-2xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.2em]">No Active Registrations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {students.map((student, idx) => (
              <StudentCard key={student.id || student.student_code || idx} student={student} />
            ))}
          </div>
        )}
        
        <footer className="pt-12 pb-8 text-center">
           <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">Integrated Learning Systems</p>
        </footer>
      </div>
    </main>
  );
}
