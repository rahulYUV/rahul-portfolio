'use client';

import { WorkDrawer } from '@/components/home/WorkDrawer';

export function WorkCarousel() {
  return (
    <div
      className="relative w-full aspect-video rounded-[8px] overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.04)]"
      style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
    >
      <div className="absolute inset-0 w-full h-full">
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/tRsQsTMvPNg?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0"
          title="YouTube live stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
        <WorkDrawer>
          <button className="px-3.5 py-1.5 rounded-full text-sm font-medium text-white backdrop-blur-md bg-black/20 border border-white/15 shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-150 hover:bg-black/30 cursor-pointer">
            View work
          </button>
        </WorkDrawer>
      </div>
    </div>
  );
}
