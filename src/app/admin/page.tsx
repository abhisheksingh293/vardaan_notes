"use client";
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, CheckCircle, Database, BookOpen, FolderDown, 
  Layout, ArrowRight, LogOut, Info, Settings, 
  Search, FileText, ChevronRight, Folder, RefreshCw,
  Plus, Edit2, Trash2, Home, BarChart3, Clock, ExternalLink, ArrowLeft, Link2,
  Calculator, Atom, Dna, Languages, Palette, Music, Globe, Pipette, Layers,
  Cpu, Landmark, Briefcase, Zap, FlaskConical, Microscope, MonitorPlay
} from 'lucide-react';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tab = 'dashboard' | 'students' | 'deployer' | 'global' | 'tests';

export default function AdminPanel() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ error: '', success: '', loading: false });
  
  const [students, setStudents] = useState<any[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<{ CBSE: string[], ICSE: string[] }>({ CBSE: [], ICSE: [] });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Deployer State
  const [form, setForm] = useState({ studentCode: '', subject: '', chapter: '' });
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
  const [existingChapters, setExistingChapters] = useState<string[]>([]);
  const [isCreatingNewChapter, setIsCreatingNewChapter] = useState(false);

  // Student Explorer State
  const [selectedStudentTree, setSelectedStudentTree] = useState<any>(null);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeStudentCode, setActiveStudentCode] = useState<string | null>(null);
  
  // Configuration State
  const [activeConfigBoard, setActiveConfigBoard] = useState<'CBSE' | 'ICSE'>('CBSE');
  const [configSearchQuery, setConfigSearchQuery] = useState('');

  const baseURL = '/api';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (e: any) => {
    e.preventDefault();
    setStatus({ ...status, loading: true, error: '' });
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password,
    });
    if (error) {
      setStatus({ error: error.message, success: '', loading: false });
    } else {
      setStatus({ error: '', success: 'Logged in successfully', loading: false });
    }
  };

  const getHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`
  });

  useEffect(() => {
    if (session) {
      axios.get(`${baseURL}/students`, { headers: getHeaders() })
        .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error(err));

      axios.get(`${baseURL}/admin/config/subjects`, { headers: getHeaders() })
        .then(res => setGlobalSubjects(res.data))
        .catch(err => console.error(err));
    }
  }, [session, baseURL]);

  // Fetch data for deployer
  useEffect(() => {
    if (session && form.studentCode && activeTab === 'deployer') {
      axios.get(`${baseURL}/files/${form.studentCode}/subjects`, { headers: getHeaders() })
        .then(res => setExistingSubjects(Array.isArray(res.data) ? res.data : []))
        .catch(err => setExistingSubjects([]));
    }
  }, [form.studentCode, session, activeTab]);

  useEffect(() => {
    if (session && form.studentCode && form.subject && activeTab === 'deployer') {
      axios.get(`${baseURL}/files/${form.studentCode}/subjects/${encodeURIComponent(form.subject)}/chapters`, { headers: getHeaders() })
        .then(res => {
          const chapters = Array.isArray(res.data) ? res.data : [];
          setExistingChapters(chapters);
          setIsCreatingNewChapter(chapters.length === 0);
        })
        .catch(() => {
          setExistingChapters([]);
          setIsCreatingNewChapter(true);
        });
    }
  }, [form.studentCode, form.subject, session, activeTab]);

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchStudentTree = async (studentCode: string) => {
    setIsTreeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const currentStudent = students.find(s => s.student_code === studentCode);
      const studentName = currentStudent?.full_name || '';
      const params = new URLSearchParams();
      if (studentName) params.set('name', studentName);
      
      const response = await axios.get(`/api/files/${studentCode}/tree?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      setSelectedStudentTree(response.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsTreeLoading(false);
    }
  };

  const initiateTest = async (type: 'Minor' | 'Major') => {
    if (!students || students.length === 0) {
      setStatus({ ...status, error: 'Student Registry not loaded. Please wait or refresh.', loading: false });
      return;
    }

    setStatus({ ...status, loading: true, error: '', success: '' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const studentCodes = students.map(s => s.student_code);
      const res = await axios.post('/api/admin/deploy/test', { type, studentCodes }, { 
        headers: { Authorization: `Bearer ${session?.access_token}` } 
      });
      await fetchGlobalTests();
      setStatus({ 
        error: '', 
        success: `✅ SUCCESS: ${res.data.testName} provisioned for ${students.length} students simultaneously!`, 
        loading: false 
      });
    } catch (err: any) {
      setStatus({ error: err.response?.data?.error || err.message, success: '', loading: false });
    }
  };

  const deleteAssessment = async (testName: string) => {
    if (!window.confirm(`⚠️ NUCLEAR OPTION: This will permanently and physically delete "${testName}" from the Global Registry AND every individual student folder. This action cannot be undone. Proceed?`)) return;
    
    setStatus({ ...status, loading: true, error: '', success: '' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const studentCodes = students.map(s => s.student_code);
      await axios.post('/api/admin/deploy/test/delete', { testName, studentCodes }, { 
        headers: { Authorization: `Bearer ${session?.access_token}` } 
      });
      await fetchGlobalTests();
      setStatus({ error: '', success: `PERMANENTLY DELETED: ${testName} removed from all student repositories.`, loading: false });
    } catch (err: any) {
      setStatus({ error: err.response?.data?.error || err.message, success: '', loading: false });
    }
  };

  const deleteItem = async (params: { type: 'file' | 'test-file' | 'subject' | 'test', studentCode: string, subject?: string, chapter?: string, filename?: string, testName?: string }) => {
    const itemName = params.filename || params.testName || params.subject || 'this item';
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete "${itemName}"? This action cannot be undone and will physically remove files from storage.`)) return;

    setStatus({ ...status, loading: true, error: '', success: '' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentStudent = students.find(s => s.student_code === params.studentCode);
      const studentName = currentStudent?.full_name || '';

      await axios.post('/api/admin/delete-item', { ...params, studentName }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      setStatus({ error: '', success: `Successfully deleted ${params.type}: ${itemName}`, loading: false });
      await fetchStudentTree(params.studentCode);
    } catch (err: any) {
      setStatus({ error: err.response?.data?.error || err.message, success: '', loading: false });
    }
  };

  const [globalTestTree, setGlobalTestTree] = useState<any>({});
  const fetchGlobalTests = async () => {
     try {
        const { data: { session } } = await supabase.auth.getSession();
        // We'll create a simple helper API or use the existing tree if it's updated
        const res = await axios.get('/api/admin/config/subjects', { headers: { Authorization: `Bearer ${session?.access_token}` } });
        // Assuming subjects API returns full config including tests or we add one
        // For now, let's just use a dedicated one if we implement it.
        // I'll add a new call to a dedicated route I'm about to create.
        const treeRes = await axios.get('/api/admin/tests/global', { headers: { Authorization: `Bearer ${session?.access_token}` } });
        setGlobalTestTree(treeRes.data);
     } catch (e) {
        console.error("Failed to load global tests", e);
     }
  };

  useEffect(() => {
    if (session && activeTab === 'tests') fetchGlobalTests();
  }, [session, activeTab]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.full_name?.toLowerCase().includes(q) || 
      s.student_code?.toLowerCase().includes(q) ||
      s.school?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    const total = students.length;
    const cbse = students.filter(s => s.board?.toUpperCase().includes('CBSE')).length;
    const icse = students.filter(s => s.board?.toUpperCase().includes('ICSE') || s.board?.toUpperCase().includes('ISC')).length;
    const active = students.filter(s => s.is_active !== false).length;
    return { total, cbse, icse, active };
  }, [students]);

  const logout = async () => { await supabase.auth.signOut(); };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-6 font-sans">
        <form onSubmit={login} className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white dark:border-white/5 flex flex-col gap-6 w-full max-w-md">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold dark:text-white tracking-tight">Admin Portal</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Authentication Required</p>
          </div>
          {status.error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium animate-shake text-center">{status.error}</div>}
          <div className="space-y-4">
            <div className="group relative">
              <input 
                type="email" placeholder="Admin Email" className="w-full p-4.5 bg-zinc-100 dark:bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white border border-transparent focus:border-blue-500"
                value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}
                required
              />
            </div>
            <div className="group relative">
              <input 
                type="password" placeholder="Key Phrase" className="w-full p-4.5 bg-zinc-100 dark:bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white transition-all border border-transparent focus:border-blue-500"
                value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={status.loading} className="w-full bg-blue-600 text-white p-4.5 rounded-2xl font-bold mt-2 hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50">
            {status.loading ? 'Verifying Identity...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white dark:bg-[#09090b] border-r border-slate-200 dark:border-white/[0.05] hidden lg:flex flex-col z-20">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-10 px-2">
            <span className="font-black text-2xl tracking-tighter dark:text-white uppercase italic">VARDAAN <span className="text-blue-600">COMET</span></span>
          </div>
          
          <nav className="space-y-1.5">
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home />} label="Overview" />
            <NavItem active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users />} label="Directory" />
            <NavItem active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} icon={<MonitorPlay />} label="Assessments" />
            <NavItem active={activeTab === 'deployer'} onClick={() => setActiveTab('deployer')} icon={<FolderDown />} label="Deployer" />
            <NavItem active={activeTab === 'global'} onClick={() => setActiveTab('global')} icon={<Settings />} label="Configure" />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-100 dark:border-white/[0.05]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Logged User</p>
            <p className="text-xs font-bold dark:text-white truncate">{session.user.email}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/5 rounded-2xl transition font-bold text-sm">
            <LogOut className="w-4 h-4 cursor-pointer" /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Header (Bottom Nav) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-6 py-4 flex justify-between items-center z-50">
         <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-zinc-500'}><Home className="w-6 h-6" /></button>
         <button onClick={() => setActiveTab('students')} className={activeTab === 'students' ? 'text-blue-600' : 'text-zinc-500'}><Users className="w-6 h-6" /></button>
         <button onClick={() => setActiveTab('tests')} className={activeTab === 'tests' ? 'text-blue-600' : 'text-zinc-500'}><MonitorPlay className="w-6 h-6" /></button>
         <button onClick={() => setActiveTab('deployer')} className={activeTab === 'deployer' ? 'text-blue-600' : 'text-zinc-500'}><FolderDown className="w-6 h-6" /></button>
         <button onClick={() => setActiveTab('global')} className={activeTab === 'global' ? 'text-blue-600' : 'text-zinc-500'}><Settings className="w-6 h-6" /></button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto pb-24 lg:pb-0 h-screen scrollbar-hide">
        <header className="sticky top-0 bg-slate-50/80 dark:bg-[#09090b]/80 backdrop-blur-md px-8 py-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-black tracking-tight dark:text-white capitalize">{activeTab}</h2>
          {/* Header Actions Removed as requested */}
        </header>

        <div className="px-8 pb-10 space-y-8">
          {status.success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-sm font-bold">{status.success}</div>}
          {status.error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold">{status.error}</div>}

          {/* TAB: Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard label="Total Students" value={stats.total} icon={<Users className="w-5 h-5" />} color="bg-blue-600" />
                  <StatCard label="CBSE Board" value={stats.cbse} icon={<Database className="w-5 h-5" />} color="bg-violet-600" />
                  <StatCard label="ICSE Board" value={stats.icse} icon={<Database className="w-5 h-5" />} color="bg-amber-600" />
               </div>

               {/* Quick Action Card Removed as requested */}
            </div>
          )}

          {/* TAB: Student Directory */}
          {activeTab === 'students' && (
            <div className="space-y-6">
               {!selectedStudentTree && !isTreeLoading ? (
                 <>
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                      <div className="space-y-1">
                         <h3 className="text-xl font-black dark:text-white tracking-tighter uppercase">Student Registry</h3>
                         <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{filteredStudents.length} Active Profiles</p>
                      </div>
                      <div className="relative group min-w-[400px]">
                         <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                         <input 
                           type="text" 
                           placeholder="Search Student, Code or School..."
                           className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/[0.05] outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white transition-all shadow-xl shadow-slate-200/50 dark:shadow-none font-bold"
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStudents.map((student, idx) => (
                         <div 
                            key={student.student_code || idx} 
                            onClick={() => fetchStudentTree(student.student_code)}
                            className="bg-white dark:bg-white/[0.02] p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/[0.05] hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden cursor-pointer"
                         >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100">
                               <div className={`w-3 h-3 rounded-full ${student.board?.toUpperCase().includes('CBSE') ? 'bg-indigo-500' : 'bg-amber-500'} blur-sm`}></div>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-4 pt-2">
                               <div className={`w-20 h-20 ${getAvatarColor(student.full_name)} rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl relative`}>
                                  <div className="absolute inset-0 bg-white/10 rounded-3xl"></div>
                                  <span className="relative z-10">{student.full_name?.substring(0,1) || '?'}</span>
                               </div>

                               <div className="space-y-1">
                                  <h4 className="font-black text-xl tracking-tighter dark:text-white line-clamp-1">{student.full_name}</h4>
                                  <p className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">{student.student_code}</p>
                               </div>

                               <div className="flex items-center gap-2 pt-2">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                                     student.board?.toUpperCase().includes('CBSE') 
                                     ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-500' 
                                     : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                                  }`}>
                                     {student.board || 'Generic'}
                                  </span>
                                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-500/5 border border-zinc-500/10 text-zinc-500 rounded-lg">
                                      {student.school?.split(' ')[0] || 'Vardaan'}
                                   </span>
                                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-500/5 border border-blue-500/10 text-blue-500 rounded-lg flex items-center gap-1.5 shadow-sm">
                                      <Layers className="w-3 h-3" /> {student.material_count || 0}
                                   </span>
                                </div>

                               <div className="w-full space-y-3 pt-6">
                                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 group/url relative">
                                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1 text-left px-1">Dashboard URL</p>
                                     <div className="flex items-center justify-between gap-2 overflow-hidden">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate">
                                           {student.dashboard_url?.startsWith('http') ? student.dashboard_url : (typeof window !== 'undefined' ? `${window.location.origin}${student.dashboard_url}` : student.dashboard_url)}
                                        </span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const url = student.dashboard_url?.startsWith('http') ? student.dashboard_url : `${window.location.origin}${student.dashboard_url}`;
                                            navigator.clipboard.writeText(url);
                                            alert('URL Copied to Clipboard!');
                                          }}
                                          className="p-1.5 hover:bg-blue-600 hover:text-white rounded-lg shrink-0"
                                        >
                                          <Link2 className="w-3 h-3" />
                                        </button>
                                     </div>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fetchStudentTree(student.student_code);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                  >
                                     Explore Repository
                                  </button>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                 </>
               ) : (
                 <div>
                    {isTreeLoading ? (
                      <div className="flex flex-col items-center justify-center py-40 space-y-6">
                         <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                         <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Scanning Cloud Architecture...</p>
                      </div>
                    ) : (
                      <div className="space-y-12 pb-20 p-8 lg:p-12">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                               <button onClick={() => setSelectedStudentTree(null)} className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 group px-1">
                                  <ArrowLeft className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[10px]">Back to Registry</span>
                               </button>
                               <div className="flex items-start gap-10">
                                  <div className={`w-28 h-28 ${getAvatarColor(selectedStudentTree.folderName)} rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white dark:border-white/10`}>
                                     {selectedStudentTree.folderName.substring(0,1)}
                                  </div>
                                  <div className="space-y-2 py-2">
                                     <div className="flex items-center gap-4">
                                        <h3 className="text-4xl font-black dark:text-white tracking-tighter capitalize leading-none">{selectedStudentTree.folderName.split('_')[0]}</h3>
                                        {(() => {
                                           const student = students.find(s => s.student_code === selectedStudentTree.folderName.split('_').pop());
                                           return (
                                              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                 student?.board?.toUpperCase().includes('CBSE') 
                                                 ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                                                 : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                              }`}>
                                                 {student?.board || 'BOARD'}
                                              </span>
                                           );
                                        })()}
                                     </div>
                                     <div className="flex flex-col gap-1.5">
                                        <p className="text-xs font-black tracking-widest uppercase text-zinc-500 flex items-center gap-2">
                                           <Database className="w-3 h-3" /> System ID: <span className="text-blue-500">{selectedStudentTree.folderName.split('_').pop()}</span>
                                        </p>
                                        <p className="text-xs font-black tracking-widest uppercase text-zinc-500 flex items-center gap-2">
                                           <Home className="w-3 h-3" /> Institute: <span className="text-zinc-700 dark:text-zinc-300 italic">{students.find(s => s.student_code === selectedStudentTree.folderName.split('_').pop())?.school || 'Vardaan Comet'}</span>
                                        </p>
                                        <div className="pt-2 flex items-center gap-3">
                                           <p className="text-xs font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2 group/link cursor-pointer" 
                                              onClick={() => {
                                                const student = students.find(s => s.student_code === selectedStudentTree.folderName.split('_').pop());
                                                const url = student?.dashboard_url?.startsWith('http') ? student.dashboard_url : `${window.location.origin}${student?.dashboard_url}`;
                                                window.open(url, '_blank');
                                              }}
                                           >
                                              <ExternalLink className="w-3.5 h-3.5" /> Launch Dashboard: <span className="underline underline-offset-4 decoration-2 decoration-blue-500/30 group-hover/link:decoration-blue-500 font-mono lowercase">
                                                 {(() => {
                                                   const student = students.find(s => s.student_code === selectedStudentTree.folderName.split('_').pop());
                                                   return student?.dashboard_url || `/student/${selectedStudentTree.folderName}`;
                                                 })()}
                                              </span>
                                           </p>
                                           <button 
                                              onClick={() => {
                                                const student = students.find(s => s.student_code === selectedStudentTree.folderName.split('_').pop());
                                                const url = student?.dashboard_url?.startsWith('http') ? student.dashboard_url : `${window.location.origin}${student?.dashboard_url}`;
                                                navigator.clipboard.writeText(url);
                                                alert('Dashboard URL Copied!');
                                              }}
                                              className="p-1.5 bg-blue-500/5 hover:bg-blue-500 text-zinc-500 hover:text-white rounded-lg border border-blue-500/10"
                                           >
                                              <Link2 className="w-3 h-3" />
                                           </button>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>

                          <div className="grid grid-cols-1 gap-12">
                            <div className="lg:col-span-12 space-y-8">
                              {/* Test Management Workspace */}
                              <div className="bg-white dark:bg-white/[0.02] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/[0.05] shadow-xl space-y-8">

                                {selectedStudentTree.testTree && Object.keys(selectedStudentTree.testTree).length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(selectedStudentTree.testTree).map(([testName, files]: [string, any]) => (
                                      <div key={testName} className="p-6 bg-slate-50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-200 dark:border-white/[0.05] group/test">
                                        <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${testName.includes('Major') ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} />
                                            <span className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{testName}</span>
                                          </div>
                                          <button 
                                            onClick={() => deleteItem({ type: 'test', studentCode: selectedStudentTree.folderName.split('_').pop()!, testName })}
                                            className="opacity-0 group-hover/test:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          {files.map((file: string) => (
                                            <div key={file} className="flex items-center justify-between p-3.5 bg-white dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 group/file">
                                              <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-zinc-400 group-hover/file:text-blue-500" />
                                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate lowercase">{file}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <button 
                                                  onClick={() => window.open(`/storage/students/${selectedStudentTree.folderName}/Test/${encodeURIComponent(testName)}/${encodeURIComponent(file)}`, '_blank')}
                                                  className="p-1.5 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg"
                                                >
                                                  <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button 
                                                  onClick={() => deleteItem({ type: 'test-file', studentCode: selectedStudentTree.folderName.split('_').pop()!, testName, filename: file })}
                                                  className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 dark:bg-white/[0.01] p-16 rounded-[2.5rem] border border-dashed border-zinc-500/20 text-center space-y-4">
                                    <MonitorPlay className="w-12 h-12 text-zinc-500 mx-auto opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No Assessment Records Found</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                {Object.entries(selectedStudentTree.tree).length === 0 ? (
                                  <div className="text-center py-20 bg-slate-50 dark:bg-white/[0.01] rounded-[2rem] border border-dashed border-zinc-500/20">
                                    <p className="text-sm font-bold text-zinc-500 italic uppercase">No subjects found in this workspace.</p>
                                  </div>
                                ) : (
                                  Object.entries(selectedStudentTree.tree).map(([sub, chapters]: [string, any]) => (
                                    <div key={sub} className="space-y-2">
                                      <div 
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggleFolder(sub)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFolder(sub); }}
                                        className={`w-full flex items-center justify-between p-5 rounded-2xl cursor-pointer group ${
                                          expandedFolders[sub] 
                                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                                          : 'bg-slate-50 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-4">
                                          <span className="flex items-center gap-4 text-base font-black">
                                            <ModernSubjectIcon name={sub} size="w-10 h-10" />
                                            {sub}
                                          </span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteItem({ type: 'subject', studentCode: selectedStudentTree.folderName.split('_').pop()!, subject: sub });
                                            }}
                                            className="ml-2 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 ${expandedFolders[sub] ? 'rotate-90' : 'opacity-40'}`} />
                                      </div>
                                      
                                      {expandedFolders[sub] && (
                                        <div className="pl-8 space-y-3 mt-3 pt-2 border-l-2 border-slate-100 dark:border-white/5 ml-6">
                                          {Object.entries(chapters).map(([chap, files]: [string, any]) => (
                                            <div key={chap} className="space-y-1">
                                              <div 
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleFolder(`${sub}-${chap}`)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFolder(`${sub}-${chap}`); }}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 group/chap cursor-pointer"
                                              >
                                                <span className={`flex items-center gap-3 text-xs font-black uppercase ${expandedFolders[`${sub}-${chap}`] ? 'text-blue-500' : 'text-zinc-500'}`}>
                                                  <span className={`w-2 h-2 rounded-full ${expandedFolders[`${sub}-${chap}`] ? 'bg-blue-500 scale-125' : 'bg-zinc-700 opacity-20'}`}></span>
                                                  {chap}
                                                </span>
                                                <ChevronRight className={`w-3.5 h-3.5 ${expandedFolders[`${sub}-${chap}`] ? 'rotate-90 text-blue-500' : 'opacity-30'}`} />
                                              </div>
                                              
                                              {expandedFolders[`${sub}-${chap}`] && (
                                                <div className="pl-6 space-y-2 pt-1">
                                                  {files.map((file: string) => (
                                                    <div key={file} className="flex items-center justify-between gap-3 text-[11px] font-bold text-zinc-400 py-1.5 border-l border-slate-100 dark:border-white/5 pl-4 group/file hover:text-blue-500/80">
                                                      <div className="flex items-center gap-2 truncate">
                                                        <FileText className="w-3.5 h-3.5 opacity-40 group-hover/file:opacity-100" /> {file}
                                                      </div>
                                                      <div className="flex items-center gap-1.5 mr-2">
                                                        <button 
                                                          onClick={() => window.open(`/storage/students/${selectedStudentTree.folderName}/subjects/${encodeURIComponent(sub)}/${encodeURIComponent(chap)}/${encodeURIComponent(file)}`, '_blank')}
                                                          className="opacity-0 group-hover/file:opacity-100 hover:text-blue-600 p-1"
                                                        >
                                                          <ExternalLink className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                          onClick={() => deleteItem({ type: 'file', studentCode: selectedStudentTree.folderName.split('_').pop()!, subject: sub, chapter: chap, filename: file })}
                                                          className="opacity-0 group-hover/file:opacity-100 hover:text-red-500 p-1"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* TAB: Global Assessments Command Center */}
          {activeTab === 'tests' && (
            <div className="space-y-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-white/5">
                  <div className="space-y-2">
                     <h3 className="text-3xl font-black dark:text-white tracking-tighter uppercase">Global Test Console</h3>
                     <p className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Master Assessment Provisioning</p>
                  </div>
                  <div className="flex gap-4">
                     <button 
                        onClick={() => initiateTest('Minor')}
                        disabled={status.loading}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center gap-3 disabled:opacity-50"
                     >
                        <Plus className="w-5 h-5" /> Deploy Global Minor Test
                     </button>
                     <button 
                        onClick={() => initiateTest('Major')}
                        disabled={status.loading}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-3 disabled:opacity-50"
                     >
                        <Plus className="w-5 h-5" /> Deploy Global Major Test
                     </button>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                     <h4 className="text-xl font-black dark:text-white tracking-tight uppercase">Global Inventory</h4>
                  </div>

                  {Object.keys(globalTestTree).length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(globalTestTree).sort().map(([testName, files]: [string, any]) => (
                           <div key={testName} className="bg-white dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl transition-all hover:border-blue-500/30 group relative">
                              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => deleteAssessment(testName)}
                                  disabled={status.loading}
                                  className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 active:scale-90 transition-all disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mb-8">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${testName.includes('Major') ? 'bg-blue-600 shadow-blue-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
                                    <MonitorPlay className="w-8 h-8" />
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Inventory Status</p>
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-tight">Active</p>
                                 </div>
                              </div>
                              <h5 className="text-xl font-black dark:text-white tracking-tighter uppercase mb-6 truncate pr-10">{testName}</h5>
                              
                              <div className="space-y-2">
                                 {files.map((file: string) => (
                                    <div key={file} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-100 dark:border-white/5 group/file">
                                       <FileText className="w-4 h-4 text-zinc-400" />
                                       <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate lowercase">{file}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="bg-white dark:bg-white/[0.02] p-20 rounded-[3rem] border border-dashed border-zinc-500/20 text-center space-y-4">
                        <MonitorPlay className="w-16 h-16 text-zinc-500 mx-auto opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No Global Tests Provisioned</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* TAB: Deployer */}
          {activeTab === 'deployer' && (
            <div className="max-w-3xl mx-auto py-8 space-y-12">
               {/* Console Header */}
               <div className="text-center space-y-4">
                  <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 mb-4">
                    <FolderDown className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-4xl font-black dark:text-white tracking-tighter uppercase">Resource Command</h3>
                  <p className="text-zinc-500 font-bold text-xs tracking-widest uppercase">System-Wide Asset Provisioning</p>
               </div>

               <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-zinc-200 dark:border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
                  {/* Visual Decoration */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full"></div>
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full"></div>

                  <div className="space-y-8 relative">
                    <FormGroup label="1. Target Student Identity" icon={<Users />}>
                       <CustomSelect 
                         options={students.map(s => ({ value: s.student_code, label: `${s.full_name} (${s.student_code})` }))}
                         value={form.studentCode}
                         onChange={(val: string) => setForm({...form, studentCode: val, subject: '', chapter: ''})}
                         placeholder="-- Identify Student --"
                       />
                    </FormGroup>

                    <FormGroup label="2. Academic Domain" icon={<BookOpen />}>
                       <CustomSelect 
                         options={(students.find(s => s.student_code === form.studentCode)?.board?.toUpperCase().includes('CBSE') ? globalSubjects.CBSE : globalSubjects.ICSE)?.map(sub => ({ value: sub, label: sub })) || []}
                         value={form.subject}
                         onChange={(val: string) => setForm({...form, subject: val})}
                         disabled={!form.studentCode}
                         placeholder="-- Select Subject --"
                       />
                    </FormGroup>

                    <FormGroup label="3. Module Specification" icon={<FileText />}>
                      <div className="space-y-4">
                        <CustomSelect 
                          options={[
                            ...existingChapters.map(chap => ({ value: chap, label: chap })),
                            { value: '_new_', label: '+ INITIALIZE NEW MODULE' }
                          ]}
                          value={isCreatingNewChapter ? "_new_" : form.chapter}
                          onChange={(val: string) => {
                            if (val === "_new_") {
                              setIsCreatingNewChapter(true);
                              setForm({...form, chapter: ''});
                            } else {
                              setIsCreatingNewChapter(false);
                              setForm({...form, chapter: val});
                            }
                          }}
                          disabled={!form.studentCode || !form.subject}
                          placeholder="-- Specify Module --"
                        />
                        
                        {isCreatingNewChapter && (
                          <input 
                            type="text" 
                            placeholder="Type Module Name..."
                            className="w-full py-5 px-6 bg-blue-500/5 dark:bg-blue-500/10 border-2 border-blue-500/30 rounded-[1.8rem] outline-none focus:ring-0 text-zinc-900 dark:text-white font-black text-sm tracking-tight placeholder:opacity-30"
                            value={form.chapter} 
                            onChange={e => setForm({...form, chapter: e.target.value})} 
                          />
                        )}
                      </div>
                    </FormGroup>

                    {/* Live Path Visualization */}
                    {form.studentCode && form.subject && form.chapter && (
                       <div className="mt-4 p-5 bg-zinc-900/80 rounded-[2rem] border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">Deployment Payload Target:</p>
                          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 overflow-hidden">
                             <Folder className="w-3 h-3 shrink-0" />
                             <span className="truncate">storage/students/{students.find(s => s.student_code === form.studentCode)?.full_name}_{form.studentCode}/subjects/{form.subject}/{form.chapter}/</span>
                          </div>
                          <div className="flex gap-4 mt-3 opacity-40">
                             {['notes.html', 'worksheet.html', 'quiz.html', 'solution.html'].map(f => (
                                <div key={f} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                                   <FileText className="w-3 h-3" /> {f}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                  </div>

                  <button 
                    onClick={async () => {
                      setStatus({ ...status, loading: true, error: '', success: '' });
                      try {
                         const student = students.find(s => s.student_code === form.studentCode);
                         await axios.post(`${baseURL}/admin/create-folder`, { 
                           studentCode: form.studentCode, 
                           studentName: student?.full_name,
                           subject: form.subject, 
                           chapter: form.chapter 
                         }, { headers: getHeaders() });

                         const defaultFiles = ['notes.html', 'worksheet.html', 'quiz.html', 'solution.html'];
                         for (const filename of defaultFiles) {
                           const title = filename.split('.')[0];
                           await axios.post(`${baseURL}/admin/create-file`, {
                             studentCode: form.studentCode,
                             studentName: student?.full_name,
                             subject: form.subject,
                             chapter: form.chapter,
                             filename,
                             content: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:3rem;line-height:1.6;color:#1e293b;"><h1 style="color:#2563eb;border-bottom:3px solid #f1f5f9;padding-bottom:1rem;margin-bottom:2rem;">${title.toUpperCase()}</h1><h2 style="font-size:1.1rem;color:#64748b;">MODULE: ${form.chapter}</h2><div style="margin-top:2rem;padding:2rem;background:#f8fafc;border-radius:1.5rem;border:1px solid #f1f5f9;">Content Template Auto-Generated on Platform Portal.</div></body></html>`
                           }, { headers: getHeaders() });
                         }
                         setStatus({ error: '', success: `DEPLOYED: ${form.chapter} structure created for ${student?.full_name}!`, loading: false });
                         setForm({...form, chapter: ''});
                      } catch (err: any) {
                         setStatus({ error: err.response?.data?.error || err.message, success: '', loading: false });
                      }
                    }}
                    disabled={status.loading || !form.studentCode || !form.subject || !form.chapter}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/30 disabled:opacity-30 flex items-center justify-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%]"></div>
                    {status.loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><FolderDown className="w-7 h-7" /> INITIATE DEPLOYMENT</>}
                  </button>
               </div>
            </div>
          )}

          {/* TAB: Global Settings */}
          {activeTab === 'global' && (
            <div className="max-w-5xl mx-auto space-y-12">
               {/* Elite Workspace Header */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 dark:border-white/5 pb-10">
                  <div className="space-y-3">
                     <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                           {['CBSE', 'ICSE'].map(b => (
                              <button 
                                 key={b}
                                 onClick={() => setActiveConfigBoard(b as any)}
                                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase ${
                                    activeConfigBoard === b 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'text-zinc-500 hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:text-zinc-800 dark:hover:text-white'
                                 }`}
                              >
                                 {b} Registry
                              </button>
                           ))}
                        </div>
                     </div>
                  
                  <div className="relative min-w-[320px]">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                     <input 
                        type="text" 
                        placeholder="Live Filter Master List..."
                        className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-white/[0.03] rounded-[1.5rem] border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm font-bold"
                        value={configSearchQuery}
                        onChange={e => setConfigSearchQuery(e.target.value)}
                     />
                  </div>
               </div>

               {/* Registry Deck */}
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between pb-2">
                     <p className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase italic">Active Board: {activeConfigBoard} Mastery Index</p>
                     <button 
                        onClick={async () => {
                           const val = prompt('Initialize New Subject Entity:');
                           if (val) {
                              const newList = [...(globalSubjects[activeConfigBoard] || []), val];
                              try {
                                 await axios.post(`${baseURL}/admin/config/subjects`, { board: activeConfigBoard, subjects: newList }, { headers: getHeaders() });
                                 setGlobalSubjects({ ...globalSubjects, [activeConfigBoard]: newList });
                              } catch (err: any) { alert(err.message); }
                           }
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2"
                     >
                        <Plus className="w-4 h-4" /> Add Subject
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {globalSubjects[activeConfigBoard]
                        ?.filter(s => s.toLowerCase().includes(configSearchQuery.toLowerCase()))
                        .map(subject => (
                        <div 
                           key={subject} 
                           className="flex items-center justify-between p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-[2rem] hover:border-blue-500/30 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5"
                        >
                           <div className="flex items-center gap-4 flex-1 min-w-0">
                              <ModernSubjectIcon name={subject} />
                              <span className="font-black text-sm tracking-tight capitalize dark:text-zinc-200 truncate">{subject}</span>
                           </div>
                           
                           <div className="flex gap-2 ml-4 shrink-0">
                              <button 
                                 onClick={async () => {
                                    const val = prompt('Rename Registry Entry:', subject);
                                    if (val && val !== subject) {
                                       try {
                                          await axios.post(`${baseURL}/admin/config/subjects/rename`, { board: activeConfigBoard, oldName: subject, newName: val }, { headers: getHeaders() });
                                          const updatedList = globalSubjects[activeConfigBoard].map(s => s === subject ? val : s);
                                          setGlobalSubjects({ ...globalSubjects, [activeConfigBoard]: updatedList });
                                       } catch (err: any) { alert(err.message); }
                                    }
                                 }}
                                 className="w-9 h-9 bg-zinc-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 rounded-xl flex items-center justify-center"
                              >
                                 <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                 onClick={async () => {
                                    if (confirm('Permanently purge this entry from the master registry?')) {
                                       const newList = globalSubjects[activeConfigBoard].filter(s => s !== subject);
                                       try {
                                          await axios.post(`${baseURL}/admin/config/subjects`, { board: activeConfigBoard, subjects: newList }, { headers: getHeaders() });
                                          setGlobalSubjects({ ...globalSubjects, [activeConfigBoard]: newList });
                                       } catch (err: any) { alert(err.message); }
                                    }
                                 }}
                                 className="w-9 h-9 bg-zinc-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl flex items-center justify-center"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>

                  {(!globalSubjects[activeConfigBoard] || globalSubjects[activeConfigBoard].length === 0) && (
                     <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-dashed border-zinc-500/30">
                           <Database className="w-10 h-10 text-zinc-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Global Index Uninitialized</p>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Internal Components
function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold outline-none border-none ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
          : 'text-zinc-500 hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:text-zinc-800 dark:hover:text-white'
      }`}
    >
      <span className={active ? 'text-white' : 'text-zinc-400'}>{icon}</span>
      <span className="text-sm tracking-tight">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
    </button>
  );
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 
    'bg-cyan-500', 'bg-teal-500', 'bg-fuchsia-500'
  ];
  const charCode = (name || '??').charCodeAt(0);
  return colors[charCode % colors.length];
}

function getSubjectIcon(name: string) {
  const n = name.toLowerCase();
  
  // Science & Tech
  if (n.includes('math')) return <Calculator className="w-4 h-4" />;
  if (n.includes('phys')) return <Zap className="w-4 h-4" />;
  if (n.includes('chem')) return <FlaskConical className="w-4 h-4" />;
  if (n.includes('bio')) return <Dna className="w-4 h-4" />;
  if (n.includes('comp') || n.includes('it') || n.includes('coding') || n.includes('programming') || n.includes('software')) return <Cpu className="w-4 h-4" />;
  if (n.includes('sci') || n.includes('env')) return <Microscope className="w-4 h-4" />;

  // Humanities & Languages
  if (n.includes('hist') || n.includes('civic')) return <Landmark className="w-4 h-4" />;
  if (n.includes('geo')) return <Globe className="w-4 h-4" />;
  if (n.includes('social') || n.includes('socio') || n.includes('psych') || n.includes('pol')) return <Users className="w-4 h-4" />;
  if (n.includes('eng') || n.includes('hindi') || n.includes('lang') || n.includes('sans')) return <Languages className="w-4 h-4" />;
  if (n.includes('lit')) return <BookOpen className="w-4 h-4" />;

  // Commerce & Finance
  if (n.includes('econ')) return <BarChart3 className="w-4 h-4" />;
  if (n.includes('account')) return <Landmark className="w-4 h-4" />;
  if (n.includes('busin') || n.includes('comm') || n.includes('mgmt')) return <Briefcase className="w-4 h-4" />;

  // Arts
  if (n.includes('art') || n.includes('paint') || n.includes('design')) return <Palette className="w-4 h-4" />;
  if (n.includes('music')) return <Music className="w-4 h-4" />;
  
  return <BookOpen className="w-4 h-4" />;
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
  if (n.includes('econ') || n.includes('account') || n.includes('busin') || n.includes('comm')) return { color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/20' };
  if (n.includes('art') || n.includes('music')) return { color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', glow: 'shadow-fuchsia-500/20' };
  return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', glow: 'shadow-slate-500/20' };
}

function ModernSubjectIcon({ name, size = "w-12 h-12" }: { name: string, size?: string }) {
  const theme = getSubjectTheme(name);
  return (
    <div className={`${size} ${theme.bg} ${theme.border} border backdrop-blur-md rounded-2xl flex items-center justify-center ${theme.color} shadow-lg ${theme.glow} shrink-0`}>
      {getSubjectIcon(name)}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-white/[0.02] p-8 rounded-[2rem] border border-slate-200 dark:border-white/[0.05] shadow-xl shadow-slate-200/50 dark:shadow-none">
       <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white mb-6 shadow-lg shadow-black/5`}>
          {icon}
       </div>
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">{label}</p>
          <p className="text-3xl font-black dark:text-white tracking-tighter">{value}</p>
       </div>
    </div>
  );
}

function FormGroup({ label, icon, children }: any) {
  return (
    <div className="space-y-3">
       <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 px-1">
          <span className="p-1 bg-slate-100 dark:bg-white/5 rounded-md text-zinc-500">{icon}</span> {label}
       </label>
       {children}
    </div>
  );
}

function CustomSelect({ options, value, onChange, placeholder, disabled }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);

  return (
    <div className="relative">
      <button 
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-5 px-6 bg-slate-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-[1.8rem] text-left outline-none focus:ring-4 focus:ring-blue-500/20 text-zinc-900 dark:text-white font-black text-sm tracking-tight flex items-center justify-between disabled:opacity-30`}
      >
        <span className={!selected ? "opacity-30" : ""}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronRight className={`w-4 h-4 ${isOpen ? 'rotate-90' : 'opacity-40'}`} />
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#18181b]/95 backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-2xl z-40 overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-2 py-4 custom-scrollbar">
              {options.map((opt: any) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl font-bold text-xs uppercase tracking-tight ${
                    value === opt.value 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
