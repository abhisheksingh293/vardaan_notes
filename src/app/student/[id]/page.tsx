"use client";
import { useState, useEffect, use, Suspense } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, MonitorPlay, BookOpen, Folder, FileText, ChevronRight, CheckCircle,
  Calculator, Atom, Dna, Languages, Palette, Music, Globe, FlaskConical, Microscope,
  Cpu, Landmark, Users, BarChart3, Briefcase, Zap
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

function getSubjectIcon(name: string) {
  const n = name.toLowerCase();
  
  if (n.includes('math')) return <Calculator className="w-6 h-6" />;
  if (n.includes('phys')) return <Zap className="w-6 h-6" />;
  if (n.includes('chem')) return <FlaskConical className="w-6 h-6" />;
  if (n.includes('bio')) return <Dna className="w-6 h-6" />;
  if (n.includes('comp') || n.includes('it') || n.includes('coding') || n.includes('program')) return <Cpu className="w-6 h-6" />;
  if (n.includes('sci') || n.includes('env')) return <Microscope className="w-6 h-6" />;
  if (n.includes('hist') || n.includes('civic')) return <Landmark className="w-6 h-6" />;
  if (n.includes('geo')) return <Globe className="w-6 h-6" />;
  if (n.includes('social') || n.includes('socio') || n.includes('psych') || n.includes('pol')) return <Users className="w-6 h-6" />;
  if (n.includes('eng') || n.includes('hindi') || n.includes('lang') || n.includes('sans')) return <Languages className="w-6 h-6" />;
  if (n.includes('lit')) return <BookOpen className="w-6 h-6" />;
  if (n.includes('econ')) return <BarChart3 className="w-6 h-6" />;
  if (n.includes('account')) return <Landmark className="w-6 h-6" />;
  if (n.includes('busin') || n.includes('comm') || n.includes('mgmt')) return <Briefcase className="w-6 h-6" />;
  if (n.includes('art') || n.includes('paint')) return <Palette className="w-6 h-6" />;
  if (n.includes('music')) return <Music className="w-6 h-6" />;
  
  return <BookOpen className="w-6 h-6" />;
}

function getSubjectTheme(name: string) {
  const n = name.toLowerCase();
  if (n.includes('math')) return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/20' };
  if (n.includes('phys')) return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' };
  if (n.includes('chem')) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' };
  if (n.includes('bio')) return { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-rose-500/20' };
  if (n.includes('comp') || n.includes('it') || n.includes('coding')) return { color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', glow: 'shadow-violet-500/20' };
  if (n.includes('hist') || n.includes('geo') || n.includes('pol') || n.includes('land')) return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/20' };
  if (n.includes('eng') || n.includes('hindi') || n.includes('sans')) return { color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/20' };
  if (n.includes('econ') || n.includes('account') || n.includes('comm')) return { color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/20' };
  if (n.includes('art') || n.includes('music')) return { color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', glow: 'shadow-fuchsia-500/20' };
  return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', glow: 'shadow-slate-500/20' };
}

function ModernSubjectIcon({ name, size = "w-14 h-14" }: { name: string, size?: string }) {
  const theme = getSubjectTheme(name);
  return (
    <div className={`${size} ${theme.bg} ${theme.border} border backdrop-blur-md rounded-2xl flex items-center justify-center ${theme.color} shadow-lg ${theme.glow} shrink-0`}>
      {getSubjectIcon(name)}
    </div>
  );
}

export default function StudentDashboard({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-zinc-950"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <StudentDashboardContent params={params} />
    </Suspense>
  );
}

function StudentDashboardContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unwrappedParams = use(params);
  const rawId = decodeURIComponent(unwrappedParams.id);
  const studentCode = rawId.includes('_') ? rawId.split('_').pop() || rawId : rawId;
  const studentName = rawId.includes('_') ? rawId.substring(0, rawId.lastIndexOf('_')) : undefined;
  
  const [mounted, setMounted] = useState(false);
  
  const { data: student, error: studentError, isLoading: studentLoading } = useSWR(`/api/students/${studentCode}`, fetcher, { 
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateIfStale: true
  });
  const { data: treeData, error: treeError, isLoading: treeLoading } = useSWR(`/api/files/${studentCode}/tree${studentName ? `?name=${encodeURIComponent(studentName)}` : ''}`, fetcher, { 
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateIfStale: true
  });
  
  const tree = treeData?.tree || null;
  const testTree = treeData?.testTree || null;
  const resolvedFolderName = treeData?.folderName || studentCode;

  const selectedSubject = searchParams.get('subject');
  const selectedChapter = searchParams.get('chapter');
  const isViewingTests = searchParams.get('viewTests') === 'true';
  const selectedTest = searchParams.get('test');

  const updateState = (updates: Record<string, string | null>) => {
     const params = new URLSearchParams(searchParams.toString());
     Object.entries(updates).forEach(([key, val]) => {
        if (val === null) params.delete(key);
        else params.set(key, val);
     });
     router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHardLoading = !mounted || (!student && studentLoading) || (!tree && treeLoading);

  if (isHardLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (studentError || !student) {
    return <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA]">
        <p className="text-xl font-medium mb-4">Content not available.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
    </div>;
  }

  const subjects = tree ? Object.keys(tree) : [];
  const chapters = selectedSubject && tree && tree[selectedSubject] ? Object.keys(tree[selectedSubject]) : [];
  const files = selectedChapter && selectedSubject && tree && tree[selectedSubject] && tree[selectedSubject][selectedChapter] ? tree[selectedSubject][selectedChapter] : [];

  const handleBack = () => {
    if (selectedTest) updateState({ test: null });
    else if (isViewingTests) updateState({ viewTests: null });
    else if (selectedChapter) updateState({ chapter: null });
    else if (selectedSubject) updateState({ subject: null });
  };

  const isDrillDown = selectedSubject || isViewingTests;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 py-2 flex-1 flex flex-col">
        
        {/* Navigation Context / Back Button */}
        {isDrillDown && (
          <div className="flex items-center gap-3 py-4 sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-sm z-10 mx-[-1rem] px-4">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-900 active:bg-zinc-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">
                 {isViewingTests ? 'Assessments' : selectedSubject}
               </span>
               <h2 className="text-lg font-black text-zinc-900 truncate leading-none capitalize">
                 {selectedTest || selectedChapter || 'Select Module'}
               </h2>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-6 pb-12">
          
          {/* Main Dashboard (Entry view) */}
          {!isDrillDown && (
            <div className="space-y-8 pt-4">
               {/* Test Section */}
               {testTree && Object.keys(testTree).length > 0 && (
                 <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 px-2">Assessments</h3>
                    <button 
                      onClick={() => updateState({ viewTests: 'true' })}
                      className="w-full flex items-center justify-between bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm active:bg-zinc-50 text-left relative overflow-hidden"
                    >
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                           <MonitorPlay className="w-7 h-7" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-zinc-900 tracking-tight">Practice Tests</h4>
                           <p className="text-xs font-medium text-zinc-500">{Object.keys(testTree).length} active papers</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-300" />
                    </button>
                 </section>
               )}

               {/* Subject Section */}
               <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 px-2">Academic Subjects</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {subjects.map(subject => (
                      <button 
                        key={subject}
                        onClick={() => updateState({ subject, viewTests: null })}
                        className="flex flex-col bg-white p-5 rounded-[2.2rem] border border-zinc-200 shadow-sm active:bg-zinc-50 text-left min-h-[160px] justify-between relative overflow-hidden"
                      >
                        <ModernSubjectIcon name={subject} size="w-12 h-12" />
                        <div>
                           <h4 className="text-base font-bold text-zinc-900 tracking-tight leading-tight uppercase line-clamp-2">{subject}</h4>
                           <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">{Object.keys(tree[subject] || {}).length} Modules</p>
                        </div>
                      </button>
                    ))}
                  </div>
               </section>
            </div>
          )}

          {/* Test List View */}
          {isViewingTests && !selectedTest && (
             <div className="flex flex-col gap-3 pt-2">
                {Object.keys(testTree || {}).map(testName => (
                  <button 
                    key={testName}
                    onClick={() => updateState({ test: testName })}
                    className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm active:bg-zinc-50 group"
                  >
                     <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${testName.includes('Major') ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                           <MonitorPlay className="w-7 h-7" />
                        </div>
                        <div>
                           <h4 className="text-base font-bold text-zinc-900 tracking-tight uppercase line-clamp-1">{testName}</h4>
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{testTree[testName]?.length || 0} Materials</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-zinc-300" />
                  </button>
                ))}
             </div>
          )}

          {/* Test Files View */}
          {selectedTest && (
             <div className="grid grid-cols-1 gap-3 pt-2">
                {(testTree[selectedTest] || []).map((file: string, idx: number) => {
                   const isSolution = file.toLowerCase().includes('solution');
                   return (
                      <Link 
                         key={file || idx}
                         href={`/viewer?url=${encodeURIComponent(`/storage/students/${resolvedFolderName}/Test/${encodeURIComponent(selectedTest)}/${encodeURIComponent(file)}`)}`}
                         className="flex items-center justify-between bg-white p-5 rounded-[1.8rem] border border-zinc-200 shadow-sm active:bg-zinc-50"
                      >
                         <div className="flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isSolution ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                               {isSolution ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{isSolution ? 'SOLUTION' : 'QUESTION'}</span>
                               <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight truncate line-clamp-1">{file.replace('.html', '').replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                            </div>
                         </div>
                         <ChevronRight className="w-5 h-5 text-zinc-300 shrink-0" />
                      </Link>
                   );
                })}
             </div>
          )}

          {/* Chapter List View */}
          {selectedSubject && !selectedChapter && (
            <div className="grid grid-cols-1 gap-3 pt-2">
              {chapters.map(chapter => (
                <button 
                  key={chapter}
                  onClick={() => updateState({ chapter })}
                  className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm active:bg-zinc-50 text-left group"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                    <Folder className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                     <h4 className="text-base font-bold text-zinc-900 tracking-tight uppercase leading-tight line-clamp-1">{chapter}</h4>
                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{tree[selectedSubject][chapter].length} Resources</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto" />
                </button>
              ))}
            </div>
          )}

          {/* Chapters Content View */}
          {selectedChapter && (
            <div className="grid grid-cols-1 gap-3 pt-2">
              {files.map((file: any, idx: number) => {
                const rawName = file.name || file;
                const spaced = rawName.replace(/\.html$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2').replace(/[-_]/g, ' ');
                const formattedName = spaced.split(' ').filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

                return (
                  <Link 
                    key={rawName || idx}
                    href={`/viewer?url=${encodeURIComponent(`/storage/students/${resolvedFolderName}/subjects/${encodeURIComponent(selectedSubject as string)}/${encodeURIComponent(selectedChapter as string)}/${encodeURIComponent(rawName)}`)}`}
                    className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm active:bg-zinc-50"
                  >
                    <div className="flex items-center gap-5 w-full overflow-hidden">
                       <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-amber-500" />
                       </div>
                       <div className="min-w-0">
                          <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight truncate line-clamp-1 leading-none">{formattedName}</span>
                          <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mt-1 leading-none">Module Content</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
