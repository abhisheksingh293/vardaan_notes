"use client";
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 text-zinc-400 p-4 font-mono">Failed to resolve storage URL mapping.</div>;
  }

  return (
    <div className="flex flex-col h-screen w-screen absolute inset-0 bg-zinc-950 z-50">
       <div className="h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 shrink-0 shadow-sm justify-between print:hidden z-50">
          <div className="flex items-center overflow-hidden w-full">
            <button 
               onClick={() => router.back()}
               className="flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
               aria-label="Go Back"
            >
               <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px] truncate pl-3 border-l border-zinc-200 dark:border-zinc-800 ml-3">
               {(() => {
                 const rawName = decodeURIComponent(fileUrl.split('/').pop() || 'Untitled Document');
                 const noExt = rawName.replace(/\.html$/i, '');
                 const spaced = noExt.replace(/([a-z])([A-Z])/g, '$1 $2')
                                     .replace(/([a-zA-Z])(\d)/g, '$1 $2')
                                     .replace(/[-_]/g, ' ');
                 return spaced.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
               })()}
            </div>
          </div>
       </div>
       <iframe src={fileUrl} className="w-full h-full flex-1 bg-white border-none" />
    </div>
  );
}

export default function ViewerPage() {
   return (
     <Suspense fallback={<div className="h-screen w-screen bg-zinc-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
       <ViewerContent />
     </Suspense>
   );
}
