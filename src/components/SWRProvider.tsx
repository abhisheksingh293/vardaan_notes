"use client";
import React from 'react';
import { SWRConfig } from 'swr';

function localStorageProvider() {
  if (typeof window === 'undefined') return new Map();

  const map = new Map<string, any>();
  try {
     const stored = localStorage.getItem('app-cache');
     if (stored) {
       const parsed = JSON.parse(stored);
       parsed.forEach(([key, value]: [string, any]) => map.set(key, value));
     }
  } catch(e) {}
  
  window.addEventListener('beforeunload', () => {
    try {
       const appCache = JSON.stringify(Array.from(map.entries()));
       localStorage.setItem('app-cache', appCache);
    } catch(e) {}
  });

  return map;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
   return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      {children}
    </SWRConfig>
   );
}
