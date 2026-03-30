"use client";
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ViewerContent() {
  const fileUrl = useSearchParams().get('url');

  if (!fileUrl) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-zinc-400 p-4 font-mono">Failed to resolve storage URL mapping.</div>;
  }

  return (
    <div className="flex flex-col h-screen w-screen absolute inset-0 bg-[#F8F9FA]">
       <iframe 
         src={fileUrl} 
         className="w-full h-full flex-1 bg-white border-none shadow-inner" 
         title="Study Material Viewer"
       />
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
