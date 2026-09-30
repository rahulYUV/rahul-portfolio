'use client';

import { useState } from 'react';
import { ArrowUpRight, PaintBrush, Desktop, Atom, Palette, List, SquaresFour, AppWindow, Sparkle, Article, Globe, Wrench, GraduationCap, Play, Pause, MusicNote, Robot, TextAa, Plugs, BookOpen, Book, FrameCorners, Buildings, ClipboardText, Tag } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/shared/FadeIn';
import { usePlayer, extractYouTubeId } from '@/components/shared/MiniPlayer';
import stackData from '@/data/stack.json';

type StackItem = {
  name: string;
  url: string;
  href?: string;
  description: string;
  favicon: string;
  added?: string;
};

type BookItem = {
  title: string;
  author: string;
  url: string;
  bgColor: string;
  added?: string;
};

type Category = {
  name: string;
  items: (StackItem | BookItem)[];
};

const NEW_WINDOW_MS = 7 * 86400000;

function isNew(added?: string) {
  if (!added) return false;
  const ts = new Date(added + 'T00:00:00').getTime();
  return !Number.isNaN(ts) && Date.now() - ts < NEW_WINDOW_MS;
}

function NewBadge({ overlay = false }: { overlay?: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 px-1 py-px rounded text-[9px] leading-3 font-semibold tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
        overlay ? 'absolute top-2 right-2 z-10 pointer-events-none' : 'ml-1.5',
      )}
    >
      NEW
    </span>
  );
}

function sortKey(value: string) {
  return value.toLowerCase().replace(/^the\s+/, '');
}

function itemSortKey(item: StackItem | BookItem) {
  const title = 'title' in item ? item.title : item.name;
  return sortKey(title);
}

const UNSORTED_CATEGORIES = new Set(['On Repeat']);

const categories: Category[] = (stackData.categories as any[])
  .slice()
  .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))
  .map((cat) => {
    if (UNSORTED_CATEGORIES.has(cat.name)) return cat;
    return {
      ...cat,
      items: [...cat.items].sort((a, b) => itemSortKey(a).localeCompare(itemSortKey(b))),
    };
  });

const categoryIcons: Record<string, React.ElementType> = {
  Agents: Robot,
  Brand: Tag,
  'Design Agencies': Buildings,
  'Design Tools': PaintBrush,
  Components: Atom,
  'Design Systems': Palette,
  Inspiration: Sparkle,
  Mockups: FrameCorners,
  Software: AppWindow,
  Hardware: Desktop,
  Articles: Article,
  'Fun Sites': Globe,
  'Design Skills': Wrench,
  Courses: GraduationCap,
  'On Repeat': MusicNote,
  Typography: TextAa,
  APIs: Plugs,
  Directories: BookOpen,
  Read: Book,
  Specs: ClipboardText,
};

const BOOK_NOISE_FILTER_ID = 'book-cover-noise';

function BookNoiseDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute pointer-events-none" style={{ position: 'absolute' }}>
      <defs>
        <filter id={BOOK_NOISE_FILTER_ID}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}

function BookCover({ book, mini = false }: { book: BookItem; mini?: boolean }) {
  const spineWidth = mini ? '18%' : '7%';
  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden',
        mini ? 'rounded-[1.5px]' : 'rounded-r-md rounded-l-[2px]',
      )}
      style={{ background: book.bgColor }}
    >
      {!mini && (
        <svg aria-hidden preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14] [mix-blend-mode:overlay]">
          <rect width="100%" height="100%" filter={"url(#" + BOOK_NOISE_FILTER_ID + ")"} />
        </svg>
      )}
      {!mini && (
        <div
          className="absolute inset-0 pointer-events-none [mix-blend-mode:overlay]"
          style={{
            background: 'radial-gradient(ellipse at 55% 45%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.38) 100%)',
          }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 pointer-events-none [mix-blend-mode:overlay]"
        style={{
          width: spineWidth,
          background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.2) 55%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      <div className="absolute inset-y-0 pointer-events-none [mix-blend-mode:overlay]" style={{ left: spineWidth, width: '1px', background: 'rgba(0,0,0,0.6)' }} />
      <div className="absolute inset-y-0 pointer-events-none [mix-blend-mode:overlay]" style={{ left: 'calc(' + spineWidth + ' + 1px)', width: '1px', background: 'rgba(255,255,255,0.25)' }} />
    </div>
  );
}

function SectionLabel({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 shrink-0">{children}</span>
      <div className="flex-1 border-t border-dotted border-neutral-200 dark:border-neutral-700" />
      {trailing}
    </div>
  );
}

function isYouTubeItem(item: StackItem) {
  return (item.href || item.url).includes('youtube.com');
}

const STAGGER_CAP = 12;
function staggerDelay(i: number, step: number) {
  return Math.min(i, STAGGER_CAP) * step;
}

export function StackContent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const activeCategory = categories[activeIndex];
  const isBooks = activeCategory.name === 'Read';
  const { play, current, playing: playerPlaying, togglePlay } = usePlayer();

  return (
    <div className="flex flex-col desktop:grid desktop:grid-cols-[200px_1fr] desktop:gap-x-8 desktop:items-start desktop:max-w-[720px] desktop:mx-auto">
      {isBooks && <BookNoiseDefs />}
      <div className="hidden desktop:block">
        <div className="px-2.5">
          <FadeIn delay={50}><SectionLabel>Lists</SectionLabel></FadeIn>
        </div>
        <div className="mt-3 flex flex-col gap-0.5">
          {categories.map((cat, i) => {
            const Icon = categoryIcons[cat.name];
            return (
              <FadeIn key={cat.name} delay={75 + staggerDelay(i, 30)}>
                <button
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-2.5 py-1 rounded-md text-left cursor-pointer transition-colors duration-100 w-full',
                    i === activeIndex ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground' : 'text-neutral-500 dark:text-neutral-400 hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon size={14} weight="bold" />}
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-600">{cat.items.length}</span>
                </button>
              </FadeIn>
            );
          })}
        </div>
      </div>
      <div className="desktop:hidden sticky top-0 z-10 bg-background pb-4">
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 pb-1">
            {categories.map((cat, i) => {
              const Icon = categoryIcons[cat.name];
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors duration-100 shrink-0 border',
                    'border-transparent',
                    i === activeIndex ? 'bg-foreground text-background' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                  )}
                >
                  {Icon && <Icon size={12} weight="bold" />}
                  {cat.name}
                  <span className={cn('tabular-nums', i === activeIndex ? 'text-background/60' : 'text-neutral-400 dark:text-neutral-600')}>{cat.items.length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 px-1.5">
          <SectionLabel
            trailing={
              <div className="flex items-center gap-0.5 -my-1">
                <button onClick={() => setView('grid')} className={cn('p-1 rounded transition-colors duration-100 cursor-pointer', view === 'grid' ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400')}>
                  <SquaresFour size={16} weight={view === 'grid' ? 'fill' : 'regular'} />
                </button>
                <button onClick={() => setView('list')} className={cn('p-1 rounded transition-colors duration-100 cursor-pointer', view === 'list' ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400')}>
                  <List size={16} weight={view === 'list' ? 'bold' : 'regular'} />
                </button>
              </div>
            }
          >
            Links
          </SectionLabel>
        </div>
      </div>
      <div className="desktop:mt-0 w-full">
        <div className="px-1.5 hidden desktop:block">
          <FadeIn delay={50}>
            <SectionLabel
              trailing={
                <div className="flex items-center gap-0.5 -my-1">
                  <button onClick={() => setView('grid')} className={cn('p-1 rounded transition-colors duration-100 cursor-pointer', view === 'grid' ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400')}>
                    <SquaresFour size={16} weight={view === 'grid' ? 'fill' : 'regular'} />
                  </button>
                  <button onClick={() => setView('list')} className={cn('p-1 rounded transition-colors duration-100 cursor-pointer', view === 'list' ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400')}>
                    <List size={16} weight={view === 'list' ? 'bold' : 'regular'} />
                  </button>
                </div>
              }
            >
              Links
            </SectionLabel>
          </FadeIn>
        </div>
        <div className="mt-4" />
        {isBooks ? (
          view === 'list' ? (
            <div key="books-list" className="flex flex-col gap-0.5">
              {(activeCategory.items as BookItem[]).map((book, i) => (
                <FadeIn key={book.title} delay={staggerDelay(i, 25)}>
                  <a href={'https://' + book.url} target="_blank" rel="noopener noreferrer" className="group relative grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 pl-3 pr-8 py-1.5 rounded-md transition-colors duration-100 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <div className="w-[12px] h-[16px] flex items-center justify-center overflow-hidden"><BookCover book={book} mini /></div>
                    <span className="flex items-center min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{book.title}</span>
                      {isNew(book.added) && <NewBadge />}
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-600 max-w-[140px] truncate text-right">{book.author}</span>
                    <ArrowUpRight size={12} weight="bold" className="shrink-0 text-neutral-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-3" />
                  </a>
                </FadeIn>
              ))}
            </div>
          ) : (
            <div key="books-grid" className="grid grid-cols-2 desktop:grid-cols-3 gap-4 px-1.5">
              {(activeCategory.items as BookItem[]).map((book, i) => (
                <FadeIn key={book.title} delay={staggerDelay(i, 40)}>
                  <a href={'https://' + book.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <div className="relative aspect-[3/4] w-full [perspective:1400px] transition-transform duration-300 group-hover:-translate-y-0.5">
                      <div className="relative w-full h-full [transform-style:preserve-3d] [transform-origin:left_center] transition-transform duration-300 group-hover:[transform:rotateY(-10deg)]">
                        <div className="relative w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"><BookCover book={book} /></div>
                      </div>
                      {isNew(book.added) && <NewBadge overlay />}
                    </div>
                    <div className="flex items-center mt-2.5 px-0.5 min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">{book.title}</span>
                      <ArrowUpRight size={12} weight="bold" className="shrink-0 text-neutral-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1" />
                    </div>
                  </a>
                </FadeIn>
              ))}
            </div>
          )
        ) : view === 'list' ? (
            <div key="list" className="flex flex-col gap-0.5">
              {(activeCategory.items as StackItem[]).map((item, i) => {
                const isYT = isYouTubeItem(item);
                const ytVideoId = isYT ? extractYouTubeId(item.href || item.url) : null;
                const isCurrent = isYT && ytVideoId === current?.videoId;
                const isPlaying = isCurrent && playerPlaying;
                const handleClick = isYT ? (e: React.MouseEvent) => {
                  e.preventDefault();
                  if (isCurrent) togglePlay(); else if (ytVideoId) play(ytVideoId, item.name);
                } : undefined;
                return (
                  <FadeIn key={item.name} delay={staggerDelay(i, 25)}>
                    <a href={'https://' + (item.href || item.url)} target={isYT ? undefined : '_blank'} rel={isYT ? undefined : 'noopener noreferrer'} onClick={handleClick} className={cn('group relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-100 hover:bg-neutral-100 dark:hover:bg-neutral-800', isYT && 'cursor-pointer')}>
                      <div className="shrink-0 size-4 flex items-center justify-center overflow-hidden">
                        {isYT ? (isPlaying ? <Pause size={14} weight="fill" className="text-foreground transition-colors" /> : <Play size={14} weight="fill" className="text-neutral-400 group-hover:text-foreground transition-colors" />) : <img src={item.favicon} alt={item.name} width={14} height={14} loading="lazy" decoding="async" />}
                      </div>
                      <span className="flex items-center min-w-[100px]">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        {isNew(item.added) && <NewBadge />}
                      </span>
                      {!isYT && <span className="text-xs text-neutral-400 dark:text-neutral-600 flex-1 text-right hidden desktop:block transition-transform duration-150 truncate group-hover:-translate-x-4">{item.url}</span>}
                      {!isYT && <ArrowUpRight size={12} weight="bold" className="shrink-0 text-neutral-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 absolute right-3" />}
                    </a>
                  </FadeIn>
                );
              })}
            </div>
          ) : (
            <div key="grid" className="grid grid-cols-1 desktop:grid-cols-2 gap-4 px-1.5">
              {(activeCategory.items as StackItem[]).map((item, i) => {
                const isYT = isYouTubeItem(item);
                const gridYtVideoId = isYT ? extractYouTubeId(item.href || item.url) : null;
                const gridIsCurrent = isYT && gridYtVideoId === current?.videoId;
                const gridIsPlaying = gridIsCurrent && playerPlaying;
                const handleClick = isYT ? (e: React.MouseEvent) => {
                  e.preventDefault();
                  if (gridIsCurrent) togglePlay(); else if (gridYtVideoId) play(gridYtVideoId, item.name);
                } : undefined;
                return (
                  <FadeIn key={item.name} delay={staggerDelay(i, 40)}>
                    <a href={'https://' + (item.href || item.url)} target={isYT ? undefined : '_blank'} rel={isYT ? undefined : 'noopener noreferrer'} onClick={handleClick} className="group block">
                      <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-[1200/630] [&>img]:scale-[1.02]">
                        <div className="w-full aspect-[1200/630] flex items-center justify-center">
                          <img src={item.favicon} alt={item.name} width={24} height={24} loading="lazy" decoding="async" className="opacity-40" />
                        </div>
                        {isNew(item.added) && <NewBadge overlay />}
                        <div className={cn('absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 flex items-center justify-center', gridIsPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                          {isYT ? (
                            <div className="size-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                              {gridIsPlaying ? <Pause size={14} weight="fill" className="text-white" /> : <Play size={14} weight="fill" className="text-white ml-px" />}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-white">{item.url}</span>
                          )}
                        </div>
                        <div className="flex items-center mt-1.5 px-0.5 min-w-0">
                          <img src={item.favicon} alt="" width={12} height={12} loading="lazy" decoding="async" className="shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate ml-1.5">{item.name}</span>
                          <ArrowUpRight size={12} weight="bold" className="shrink-0 text-neutral-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1" />
                        </div>
                      </div>
                    </a>
                  </FadeIn>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
