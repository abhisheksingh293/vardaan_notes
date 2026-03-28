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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Vardaan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Comet</span>
            </h1>
            <p className="mt-1 md:mt-2 text-base md:text-lg text-zinc-600 dark:text-zinc-400">Manage your students and dynamic learning materials.</p>
          </div>
          <a href="/admin" className="w-full md:w-auto text-center px-5 py-3 md:py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity">
            Admin Panel
          </a>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 md:p-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 shadow-sm text-sm md:text-base">
            No students found in the database. Add users in Supabase to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {students.map((student, idx) => (
              <StudentCard key={student.id || student.student_code || idx} student={student} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
