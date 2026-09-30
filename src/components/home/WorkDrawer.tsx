'use client';

import { X } from '@phosphor-icons/react/dist/ssr';
import { Drawer } from 'vaul';

export function WorkDrawer({ children }: { children: React.ReactNode }) {
  return (
    <Drawer.Root direction="bottom">
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background outline-none rounded-t-2xl"
          style={{ maxHeight: '85vh' }}
        >
          <Drawer.Title className="sr-only">Live Stream</Drawer.Title>

          {/* Header */}
          <div className="shrink-0 border-b border-neutral-100 dark:border-neutral-800 px-5 pt-5 pb-4">
            <div className="max-w-[704px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm leading-5 font-semibold text-foreground">Live Stream</span>
              </div>
              <Drawer.Close className="p-1 -mr-1 rounded-md text-neutral-400 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150">
                <X size={16} weight="bold" />
              </Drawer.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 select-text" data-vaul-no-drag>
            <div className="max-w-[704px] mx-auto pt-8 pb-16">
              <div className="relative w-full aspect-video rounded-[12px] overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/tRsQsTMvPNg?autoplay=1&controls=1&modestbranding=1&rel=0"
                  title="YouTube live stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
