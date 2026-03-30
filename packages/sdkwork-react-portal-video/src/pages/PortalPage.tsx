import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

import { PortalHeader } from '../components/PortalHeader';
import { PortalSidebar } from '../components/PortalSidebar';

const PortalHomeExperience = lazy(() => import('../components/PortalHomeExperience'));

const PortalStartupFallback: React.FC = () => (
  <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
    <PortalSidebar />
    <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
      <PortalHeader />
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1033]/30 via-[#0a0a0a]/80 to-[#050505]" />
        </div>

        <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-[1600px] mx-auto flex flex-col items-center">
            <div className="w-full mt-20 mb-8 text-center space-y-8">
              <div className="inline-flex items-center justify-center gap-3 text-white">
                <div className="h-12 w-12 rounded-full bg-yellow-500/15" />
                <div className="space-y-3 text-left">
                  <div className="h-8 w-80 max-w-full rounded-full bg-white/12" />
                  <div className="h-4 w-56 max-w-full rounded-full bg-white/6" />
                </div>
              </div>

              <div className="max-w-[1200px] mx-auto w-full">
                <div className="rounded-[2rem] border border-white/10 bg-[#18181b]/75 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="flex items-center gap-3 border-b border-white/8 pb-5">
                    <Loader2 size={18} className="animate-spin text-blue-300" />
                    <div className="text-sm font-medium text-gray-200">Loading workspace</div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div className="h-20 rounded-3xl bg-white/6" />
                    <div className="flex flex-wrap gap-3">
                      <div className="h-9 w-36 rounded-full bg-white/7" />
                      <div className="h-9 w-28 rounded-full bg-white/7" />
                      <div className="h-9 w-32 rounded-full bg-white/7" />
                      <div className="h-9 w-24 rounded-full bg-white/7" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-7xl mx-auto w-full mt-16 px-2">
                <div className="mb-6 flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/10" />
                    <div className="h-6 w-56 rounded-full bg-white/10" />
                  </div>
                  <div className="h-8 w-24 rounded-full bg-white/6" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-[#27272a] bg-[#18181b] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-white/8" />
                        <div className="h-8 w-8 rounded-full bg-white/5" />
                      </div>
                      <div className="mt-4 h-4 w-28 rounded-full bg-white/10" />
                      <div className="mt-2 h-3 w-40 rounded-full bg-white/6" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full mt-16 pb-20 border-t border-white/5 pt-12">
              <div className="space-y-8 animate-pulse">
                <div className="flex flex-col gap-6 px-1 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-3">
                    <div className="h-7 w-56 rounded-full bg-white/10" />
                    <div className="h-4 w-80 max-w-full rounded-full bg-white/5" />
                  </div>
                  <div className="h-11 w-60 rounded-xl border border-white/10 bg-[#111]" />
                </div>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="h-56 rounded-2xl border border-white/10 bg-[#111]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PortalPage: React.FC = () => {
  return (
    <Suspense fallback={<PortalStartupFallback />}>
      <PortalHomeExperience />
    </Suspense>
  );
};

export default PortalPage;
