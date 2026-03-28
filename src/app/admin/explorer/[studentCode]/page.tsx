"use client";
import React, { useState, useEffect, use } from "react";
import axios from "axios";
import { 
  BookOpen, Folder, FileText, ChevronRight, RefreshCw, 
  ArrowLeft, Home, User, CheckCircle, Database, Layout, Search, ExternalLink, Plus
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StudentExplorer({ params }: { params: Promise<{ studentCode: string }> }) {
  const { studentCode } = use(params);
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const fetchTree = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`/api/files/${studentCode}/tree`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      setTree(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load directory tree");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [studentCode]);

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans p-8 lg:p-12 overflow-x-hidden">
      {/* Premium Header */}
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in slide-in-from-top-4 duration-700">
           <div className="space-y-4">
              <Link href="/admin" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 <span className="text-sm font-black uppercase tracking-widest">Back to Directory</span>
              </Link>
              <div className="space-y-1">
                 <h1 className="text-4xl lg:text-5xl font-black tracking-tighter flex items-center gap-4">
                    <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Resource</span> Management
                 </h1>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Live Workspace | {studentCode}</p>
                 </div>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={fetchTree}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group shadow-xl"
              >
                 <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-6 py-4 bg-blue-600 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-600/20">
                 <Database className="w-5 h-5 text-white/80" />
                 <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 leading-none">Status</p>
                    <p className="text-xs font-black text-white leading-tight">Master Sync Active</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl animate-in zoom-in-95 duration-1000">
           {loading ? (
             <div className="py-40 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                   <RefreshCw className="w-12 h-12 text-blue-500 animate-spin relative" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Scanning Cloud Architecture...</p>
             </div>
           ) : error ? (
             <div className="py-40 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 border border-red-500/20">
                   <Info className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-white tracking-widest uppercase">System Interference</h3>
                   <p className="text-sm text-zinc-500 max-w-md mx-auto">{error}</p>
                </div>
                <button 
                   onClick={fetchTree}
                   className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all font-bold"
                >
                   Retry Connection
                </button>
             </div>
           ) : (
             <div className="p-8 lg:p-12">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4 space-y-8">
                     <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6 relative group overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="space-y-4">
                           <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                              {tree?.folderName?.substring(0,1) || '?'}
                           </div>
                           <div className="space-y-1">
                              <h3 className="text-2xl font-black tracking-tighter capitalize">{tree?.folderName?.split('_')[0]}</h3>
                              <p className="text-xs font-black text-zinc-500 tracking-widest uppercase">{studentCode}</p>
                           </div>
                        </div>
                        <div className="pt-6 border-t border-white/5 space-y-4">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              <span>Physical Sync</span>
                              <span className="text-emerald-500">Online</span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              <span>Encryption</span>
                              <span className="text-blue-500">AES-256</span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] shadow-xl shadow-blue-600/20 space-y-4">
                        <h4 className="text-lg font-black text-white flex items-center gap-2">Protocol Insight</h4>
                        <p className="text-sm text-white/70 leading-relaxed font-medium">This registry reflects the live structural state of the student's storage environment. Any deployments made here are instant.</p>
                     </div>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                           <Folder className="w-4 h-4" /> Root Directory
                        </h3>
                     </div>

                     <div className="space-y-3 min-h-[400px]">
                        {Object.entries(tree.tree).length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                              <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-zinc-700 border border-dashed border-white/10">
                                 <Plus className="w-8 h-8" />
                              </div>
                              <p className="text-sm font-bold text-zinc-500 italic uppercase tracking-widest">No subjects currently active in this workspace.</p>
                           </div>
                        ) : (
                           Object.entries(tree.tree).map(([sub, chapters]: [string, any]) => (
                             <div key={sub} className="space-y-1">
                               <button 
                                 onClick={() => toggleFolder(sub)}
                                 className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
                                    expandedFolders[sub] 
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-[0.98]' 
                                    : 'bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-200'
                                 }`}
                               >
                                 <span className="flex items-center gap-4 text-base font-black">
                                    <div className={`p-2 rounded-xl ${expandedFolders[sub] ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                                       <BookOpen className={`w-4 h-4 ${expandedFolders[sub] ? 'text-white' : 'text-indigo-500'}`} />
                                    </div>
                                    {sub}
                                 </span>
                                 <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${expandedFolders[sub] ? 'rotate-90' : 'opacity-40'}`} />
                               </button>
                               
                               {expandedFolders[sub] && (
                                 <div className="pl-8 space-y-3 mt-3 pt-2 border-l border-white/10 ml-6 animate-in slide-in-from-left-4 duration-500">
                                   {Object.entries(chapters).map(([chap, files]: [string, any]) => (
                                     <div key={chap} className="space-y-1">
                                       <button 
                                         onClick={() => toggleFolder(`${sub}-${chap}`)}
                                         className={`w-full flex items-center justify-between p-3 py-4 rounded-xl transition-all ${
                                            expandedFolders[`${sub}-${chap}`] 
                                            ? 'bg-white/10 text-blue-400 border border-blue-500/30' 
                                            : 'hover:bg-white/5 text-zinc-400'
                                         }`}
                                       >
                                         <span className="flex items-center gap-3 text-xs font-black tracking-widest uppercase">
                                            <span className={`w-2 h-2 rounded-full transition-all ${expandedFolders[`${sub}-${chap}`] ? 'bg-blue-400 scale-125' : 'bg-white/20'}`}></span>
                                            {chap}
                                         </span>
                                         <ChevronRight className={`w-3 h-3 transition-transform ${expandedFolders[`${sub}-${chap}`] ? 'rotate-90' : 'opacity-20'}`} />
                                       </button>
                                       
                                       {expandedFolders[`${sub}-${chap}`] && (
                                         <div className="pl-6 space-y-1.5 mt-2 animate-in fade-in duration-500">
                                           {files.map((file: string) => (
                                             <div key={file} className="flex items-center gap-3 text-xs font-bold text-zinc-500 py-2 group hover:text-emerald-400 transition-colors cursor-default border-l border-white/5 pl-5">
                                               <FileText className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" /> {file}
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
      </div>
    </div>
  );
}
