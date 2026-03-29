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

  // Sync Drill-down state with URL Search Parameters
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

  // Initial Hydration Toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration Match: Ensure the client's first pass matches the server's fallback (the spinner).
  // Once mounted, it uses SWR's cache (student/tree) to instantly provide the dashboard view.
  const isHardLoading = !mounted || (!student && studentLoading) || (!tree && treeLoading);

  if (isHardLoading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 shadow-inner"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (studentError || !student) {
    return <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen dark:bg-zinc-950 dark:text-white">
        <p className="text-xl font-medium mb-4">Student "{studentCode}" not found.</p>
        <Link href="/" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Return Home</Link>
    </div>;
  }

  // Helper arrays
  const subjects = tree ? Object.keys(tree) : [];
  const chapters = selectedSubject && tree && tree[selectedSubject] ? Object.keys(tree[selectedSubject]) : [];
  const files = selectedChapter && selectedSubject && tree && tree[selectedSubject] && tree[selectedSubject][selectedChapter] ? tree[selectedSubject][selectedChapter] : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 flex flex-col pt-6">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col fade-in">
        
        {/* Drill-down Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 overflow-x-auto pb-2 scrollbar-width-none snap-x relative z-0">
           <button 
             onClick={() => { updateState({ subject: null, chapter: null, viewTests: null, test: null }); }}
             className={`hover:text-blue-600 dark:hover:text-blue-400 py-1 shrink-0 snap-start ${(!selectedSubject && !isViewingTests) ? 'text-blue-600 dark:text-blue-400' : ''}`}
           >
             Dashboard
           </button>
           
           {isViewingTests && (
             <>
               <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
               <button 
                 onClick={() => { updateState({ test: null }); }}
                 className={`hover:text-blue-600 dark:hover:text-blue-400 shrink-0 ${isViewingTests && !selectedTest ? 'text-blue-600 dark:text-blue-400' : ''}`}
               >
                 Tests
               </button>
             </>
           )}

           {selectedTest && (
             <>
               <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
               <span className="text-blue-600 dark:text-blue-400 shrink-0">{selectedTest}</span>
             </>
           )}

           {selectedSubject && (
             <>
               <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
               <button 
                 onClick={() => { updateState({ chapter: null }); }}
                 className={`hover:text-blue-600 dark:hover:text-blue-400 shrink-0 capitalize ${selectedSubject && !selectedChapter ? 'text-blue-600 dark:text-blue-400' : ''}`}
               >
                 {selectedSubject}
               </button>
             </>
           )}

           {selectedChapter && (
             <>
               <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
               <span
                 className="text-blue-600 dark:text-blue-400 shrink-0"
               >
                 {selectedChapter}
               </span>
             </>
           )}
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 flex flex-col relative w-full pb-20">
          
          {/* Root Level: Dual-Zone Cockpit (Tests & Subjects) */}
          {!selectedSubject && !isViewingTests && (
            <div className="w-full space-y-12">
               
               {/* Zone 1: Tests */}
               <section>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                     <h3 className="text-2xl font-black dark:text-white tracking-tight uppercase">Tests</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testTree && Object.keys(testTree).length > 0 && (
                       <button 
                         onClick={() => updateState({ viewTests: 'true' })}
                         className="group relative overflow-hidden bg-indigo-600 p-8 rounded-[2rem] border border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 text-left flex flex-col justify-between min-h-[180px] shadow-xl shadow-indigo-900/10"
                       >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 opacity-20 group-hover:opacity-30" />
                         <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner mb-6">
                            <MonitorPlay className="w-8 h-8" />
                         </div>
                         <div>
                            <h4 className="text-2xl font-black text-white tracking-tight uppercase">Tests</h4>
                         </div>
                       </button>
                    )}
                  </div>
               </section>

               {/* Zone 2: Subjects */}
               <section>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                     <h3 className="text-2xl font-black dark:text-white tracking-tight uppercase">Subjects</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.length > 0 ? subjects.map(subject => (
                      <button 
                        key={subject}
                        onClick={() => updateState({ subject, viewTests: null })}
                        className="group relative overflow-hidden bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-2xl text-left flex flex-col justify-between min-h-[180px] shadow-lg shadow-zinc-200/50 dark:shadow-none"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100" />
                        <ModernSubjectIcon name={subject} size="w-14 h-14" />
                        <div>
                           <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase line-clamp-1">{subject}</h4>
                        </div>
                      </button>
                    )) : (
                      <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                         <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs italic">No Subjects Found</p>
                      </div>
                    )}
                  </div>
               </section>
            </div>
          )}

          {/* Level -1: Global Assessment View (Accordion List) */}
          {isViewingTests && (
             <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
                <h3 className="text-2xl font-black dark:text-white mb-8 uppercase tracking-tight">Active Tests</h3>
                <div className="flex flex-col gap-4">
                   {Object.keys(testTree || {}).map(testName => {
                      const isExpanded = selectedTest === testName;
                      return (
                        <div key={testName} className="flex flex-col w-full overflow-hidden">
                          <button 
                            onClick={() => updateState({ test: isExpanded ? null : testName })}
                            className={`flex items-center justify-between bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border text-left group shadow-lg ${isExpanded ? 'border-indigo-500 shadow-indigo-500/10 ring-1 ring-indigo-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50'}`}
                          >
                             <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${testName.includes('Major') ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/20'}`}>
                                   <MonitorPlay className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                   <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase leading-none">{testName}</h4>
                                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mt-2">{testTree[testName]?.length || 0} Files Available</p>
                                </div>
                             </div>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-800 ${isExpanded ? 'rotate-90 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200' : 'text-zinc-400'}`}>
                                <ChevronRight className="w-6 h-6" />
                             </div>
                          </button>

                          {/* Accordion Content (Dropdown Files Grid) */}
                          {isExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 ml-4 sm:ml-12 animate-in slide-in-from-top-4 fade-in duration-500">
                               {(testTree[testName] || []).map((file: string, idx: number) => {
                                  const isSolution = file.toLowerCase().includes('solution');
                                  const label = isSolution ? "SOLUTION / KEY" : "QUESTION PAPER";
                                  
                                  return (
                                     <Link 
                                        key={file || idx}
                                        href={`/viewer?url=${encodeURIComponent(`/storage/students/${resolvedFolderName}/Test/${encodeURIComponent(testName)}/${encodeURIComponent(file)}`)}`}
                                        className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-[1.8rem] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-1 transition-all group/file relative overflow-hidden"
                                     >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 opacity-0 group-hover/file:opacity-100 transition-opacity" />
                                        
                                        <div className="flex items-center gap-4 relative z-10 w-full">
                                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isSolution ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                              {isSolution ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                           </div>
                                           <div className="flex flex-col min-w-0">
                                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none mb-1">{label}</span>
                                              <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight line-clamp-1">{file.replace('.html', '').replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                                           </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover/file:text-emerald-500 transition-colors shrink-0 relative z-10" />
                                     </Link>
                                  );
                               })}
                            </div>
                          )}
                        </div>
                      );
                   })}
                </div>
             </div>
          )}

          {/* Level 1: Curriculum Chapters */}
          {selectedSubject && !selectedChapter && (
            <div className="fade-in w-full animate-in duration-700">
              <h3 className="text-2xl font-black dark:text-white mb-8 uppercase tracking-tight">{selectedSubject} Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapters.length > 0 ? chapters.map(chapter => (
                  <button 
                    key={chapter}
                    onClick={() => updateState({ chapter })}
                    className="flex items-center gap-5 bg-white dark:bg-zinc-900 p-7 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow-2xl text-left group"
                  >
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:border-indigo-500/20">
                      <Folder className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-zinc-900 dark:text-white line-clamp-1 tracking-tight uppercase">{chapter}</h4>
                       <p className="text-[10px] font-black text-zinc-500 mt-1 uppercase tracking-widest">{tree[selectedSubject][chapter].length} Resources</p>
                    </div>
                  </button>
                )) : (
                   <div className="col-span-full py-16 text-center text-zinc-500 uppercase font-black text-xs tracking-widest">
                    No modules configured.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Level 2: Resource Files */}
          {selectedChapter && (
            <div className="fade-in w-full animate-in duration-700">
              <h3 className="text-2xl font-black dark:text-white mb-8 uppercase tracking-tight">{selectedChapter} Materials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {files.length > 0 ? files.map((file: any, idx: number) => {
                  const rawName = file.name || file;
                  const spaced = rawName.replace(/\.html$/i, '')
                                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                                        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
                                        .replace(/[-_]/g, ' ');
                  const formattedName = spaced.split(' ').filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

                  return (
                  <Link 
                    key={rawName || idx}
                    href={`/viewer?url=${encodeURIComponent(`/storage/students/${resolvedFolderName}/subjects/${encodeURIComponent(selectedSubject as string)}/${encodeURIComponent(selectedChapter as string)}/${encodeURIComponent(rawName)}`)}`}
                    className="flex items-center justify-between bg-white dark:bg-zinc-900 p-7 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-amber-500/50 hover:shadow-2xl text-left group"
                  >
                    <div className="flex items-center gap-5 w-full overflow-hidden">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-amber-500" />
                       </div>
                       <div>
                          <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate line-clamp-1 pr-4 uppercase tracking-tight">{formattedName}</span>
                          <p className="text-[10px] font-black text-zinc-500 tracking-widest uppercase opacity-60">Study Material</p>
                       </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 transition-colors shrink-0" />
                  </Link>
                )}) : (
                   <div className="col-span-full py-16 text-center text-zinc-500 uppercase font-black text-xs tracking-widest">
                    No resources uploaded.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
