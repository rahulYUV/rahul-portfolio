import Image from 'next/image';
import { XLogo, GithubLogo, LinkedinLogo, Envelope, ArrowUpRight, Copy } from '@phosphor-icons/react/dist/ssr';
import { WorkCarousel } from '@/components/home/WorkCarousel';
import { WeatherIcon } from '@/components/home/WeatherIcon';
import { CommitGraph } from '@/components/home/CommitGraph';
import { CopyEmail, CopyEmailRow } from '@/components/home/CopyEmail';
import { V2LeftContent } from '@/components/home/V2LeftContent';
import { FadeIn } from '@/components/shared/FadeIn';
import { ProjectRow, type ProjectItem } from '@/components/home/ProjectRow';
import { ArtDrawer } from '@/components/home/ArtDrawer';
import { DrawerNavProvider } from '@/components/home/DrawerNav';
import feedData from '@/data/feed.json';

export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommitDay = {
  date: string;
  count: number;
  repos: string[];
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCommitData() {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const firstDay = new Date(`${today}T00:00:00.000Z`);
    firstDay.setUTCDate(firstDay.getUTCDate() - 29);
    const firstDate = firstDay.toISOString().slice(0, 10);

    const contributionsByDay = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date(firstDay);
      date.setUTCDate(firstDay.getUTCDate() + i);
      contributionsByDay.set(date.toISOString().slice(0, 10), 0);
    }

    const token = process.env.GITHUB_TOKEN?.trim();
    if (!token) return { days: [] as CommitDay[], totalCommits: 0 };

    const query = `
      query ContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          login: process.env.GITHUB_USERNAME?.trim() || '0xchsh',
          from: `${firstDate}T00:00:00.000Z`,
          to: `${today}T23:59:59.999Z`,
        },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('[CommitGraph] GitHub GraphQL error:', res.status, await res.text().catch(() => ''));
      return { days: [] as CommitDay[], totalCommits: 0 };
    }

    const json = await res.json();
    if (json.errors?.length) {
      console.error('[CommitGraph] GitHub GraphQL errors:', json.errors);
      return { days: [] as CommitDay[], totalCommits: 0 };
    }

    const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
    for (const week of weeks) {
      for (const day of week.contributionDays ?? []) {
        if (contributionsByDay.has(day.date)) {
          contributionsByDay.set(day.date, day.contributionCount);
        }
      }
    }

    const days: CommitDay[] = Array.from(contributionsByDay, ([date, count]) => ({
      date,
      count,
      repos: [],
    }));

    return { days, totalCommits: days.reduce((s, d) => s + d.count, 0) };
  } catch (err) {
    console.error('[CommitGraph] Exception:', err);
    return { days: [] as CommitDay[], totalCommits: 0 };
  }
}

const WMO_DESC: Record<number, string> = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

async function getLatestCommit() {
  try {
    const res = await fetch('https://api.github.com/repos/0xchsh/portfolio/commits?per_page=1', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const commits = await res.json();
    if (!commits?.length) return null;
    return { sha: commits[0].sha.slice(0, 7), url: commits[0].html_url };
  } catch {
    return null;
  }
}

async function getWeather() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=1',
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    const code = data.current.weather_code as number;
    return {
      code,
      tempF: Math.round(data.current.temperature_2m) as number,
      desc: WMO_DESC[code] ?? 'Clear',
      highF: Math.round(data.daily.temperature_2m_max[0]) as number,
      lowF: Math.round(data.daily.temperature_2m_min[0]) as number,
    };
  } catch {
    return { code: 0, tempF: null, desc: 'Clear', highF: null, lowF: null };
  }
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const caseStudies = [
  {
    name: 'Currently Building',
    desc: 'Turning caffeinated ideas into production',
    href: '#',
    icon: '/about/about.gif',
    workTitle: 'AI Intern @ CDAC'
  },
];

// directLink: true = external link, false/undefined = opens drawer
const projects: (ProjectItem & { directLink?: boolean })[] = [
  { name: 'SplitWayy', desc: 'split the bills', href: 'https://splitwayy.vercel.app/', icon: '/icons/splitwayy.svg', workTitle: 'SplitWayy', directLink: true },
  { name: 'Chess Stats Application', desc: 'Chess analysis and stats', href: 'https://chess-aplha.vercel.app/', icon: '/icons/chess.svg', workTitle: 'Chess Stats', directLink: true },
  { name: 'Voice Assistant', desc: 'Jarvis', href: 'https://github.com/rahulYUV/Voice_assistant', icon: '/icons/voice.svg', workTitle: 'Voice Assistant', directLink: true },
  { name: 'Financial Agent', desc: 'AI-powered financial orchestration', href: 'https://github.com/rahulYUV/hackerrank-orchestrate-september26', icon: '/icons/finance.svg', workTitle: 'Financial Agent', directLink: true }
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const linkClass =
  'text-neutral-800 dark:text-neutral-200 font-medium underline decoration-dotted decoration-neutral-300 dark:decoration-neutral-600 underline-offset-[3px] hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors duration-100';

const metaLabel =
  'text-xs text-neutral-400 dark:text-neutral-600';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 shrink-0">{children}</span>
      <div className="flex-1 border-t border-dotted border-neutral-200 dark:border-neutral-700" />
    </div>
  );
}

type ArtItem = {
  title: string;
  desc?: string;
  year: string;
  icon?: string;
  images: string[];
  size: string;
  type: string[];
  collectionHref: string;
  collectionLabel: string;
  links?: { label: string; href: string }[];
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function V2Home() {
  const [{ days, totalCommits }, weather, commitHash] = await Promise.all([
    getCommitData(),
    getWeather(),
    getLatestCommit(),
  ]);

  const projectsWithDrawer = projects.filter(p => !p.directLink);
  const navTotal = caseStudies.length + projectsWithDrawer.length;
  const artNavStart = caseStudies.length + projectsWithDrawer.length;
  const projectNavMap = new Map<string, number>();
  let pIdx = caseStudies.length;
  for (const p of projectsWithDrawer) projectNavMap.set(p.name, pIdx++);

  return (
    <div className="flex flex-col desktop:grid desktop:grid-cols-[320px_320px] desktop:gap-x-16 desktop:items-start desktop:w-fit desktop:mx-auto">

      {/* Left column — Bio + sections */}
      <div className="order-[3] mt-2 desktop:mt-0 desktop:order-none">
      <DrawerNavProvider total={navTotal}>
      <V2LeftContent>

        {/* Bio */}
        <FadeIn delay={75}>
        <div className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 flex flex-col gap-3">
          <p>
            current ai Intern at CDAC Pune, turning caffeinated ideas into prod
          </p>
          <p>
           love to building and working with distributed systems, low latency systems, and autonomous AI agents.
          </p>
          <p>
          stack: typescript · java · go · redis · postgresql · docker · distributed systems · ai agents · llms
          </p>
          <p>
            Reach me at <CopyEmail className={linkClass} /> or dm on{' '}
            <a href="https://x.com/rahul_ydv7" target="_blank" rel="noopener noreferrer" className={linkClass}>x.com</a>
            {' '}or{' '}
            <a href="https://github.com/rahulYUV" target="_blank" rel="noopener noreferrer" className={linkClass}>github.com</a>
          </p>
        </div>
        </FadeIn>

        {/* Case Studies */}
        <section className="mt-8">
          <FadeIn delay={150}><SectionLabel>Working</SectionLabel></FadeIn>
          <div className="mt-3 desktop:mt-4 flex flex-col gap-3">
            <FadeIn delay={175}>
              <div className="p-3 rounded-[12px] bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <Image
                  src="/about/about.gif"
                  alt="Featured"
                  width={800}
                  height={450}
                  className="w-full h-auto rounded-[8px] object-cover pointer-events-none select-none"
                  unoptimized
                />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Projects */}
        <section className="mt-8">
          <FadeIn delay={175 + caseStudies.length * 40}><SectionLabel>Projects</SectionLabel></FadeIn>
          <div className="mt-3 desktop:mt-4 flex flex-col gap-3">
            {projects.map((item, i) => (
              <FadeIn key={item.name} delay={200 + caseStudies.length * 40 + i * 40}>
                <ProjectRow item={item} directLink={item.directLink} navIndex={projectNavMap.get(item.name)} />
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Connect */}
        <section className="mt-8">
          <FadeIn delay={225 + (caseStudies.length + projects.length) * 40}><SectionLabel>Connect</SectionLabel></FadeIn>
          <div className="mt-3 desktop:mt-4 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => {
              const connectBase = 250 + (caseStudies.length + projects.length) * 40;
              const d = connectBase + i * 40;
              if (i === 0) return <FadeIn key="email" delay={d}><CopyEmailRow /></FadeIn>;
              if (i === 1) return (
                <FadeIn key="x" delay={d}>
                  <a href="https://x.com/rahul_ydv7" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 pl-3 pr-4 py-1.5 -mx-3 rounded-[6px] hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all duration-150 w-[calc(100%+1.5rem)]">
                    <div className="shrink-0 w-10 h-10 rounded-[10px] bg-neutral-50 dark:bg-neutral-800 dark:group-hover:bg-neutral-700 transition-colors duration-150 flex items-center justify-center overflow-hidden">
                      <XLogo size={20} weight="bold" className="text-foreground transition-transform duration-150 group-hover:scale-110" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-[20px]">rahul_ydv7</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-[20px]">X.com</p>
                    </div>
                    <ArrowUpRight size={14} weight="bold" className="ml-auto shrink-0 self-center text-neutral-400 desktop:opacity-0 desktop:group-hover:opacity-100 transition-opacity duration-150" />
                  </a>
                </FadeIn>
              );
              if (i === 2) return (
                <FadeIn key="github" delay={d}>
                  <a href="https://github.com/rahulYUV" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 pl-3 pr-4 py-1.5 -mx-3 rounded-[6px] hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all duration-150 w-[calc(100%+1.5rem)]">
                    <div className="shrink-0 w-10 h-10 rounded-[10px] bg-neutral-50 dark:bg-neutral-800 dark:group-hover:bg-neutral-700 transition-colors duration-150 flex items-center justify-center overflow-hidden">
                      <GithubLogo size={20} weight="fill" className="text-foreground transition-transform duration-150 group-hover:scale-110" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-[20px]">rahulYUV</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-[20px]">GitHub</p>
                    </div>
                    <ArrowUpRight size={14} weight="bold" className="ml-auto shrink-0 self-center text-neutral-400 desktop:opacity-0 desktop:group-hover:opacity-100 transition-opacity duration-150" />
                  </a>
                </FadeIn>
              );
              if (i === 3) return (
                <FadeIn key="linkedin" delay={d}>
                  <a href="https://www.linkedin.com/in/rahul-kumar-214468268/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 pl-3 pr-4 py-1.5 -mx-3 rounded-[6px] hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all duration-150 w-[calc(100%+1.5rem)]">
                    <div className="shrink-0 w-10 h-10 rounded-[10px] bg-neutral-50 dark:bg-neutral-800 dark:group-hover:bg-neutral-700 transition-colors duration-150 flex items-center justify-center overflow-hidden">
                      <LinkedinLogo size={20} weight="fill" className="text-foreground transition-transform duration-150 group-hover:scale-110" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-[20px]">Rahul Kumar</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-[20px]">LinkedIn</p>
                    </div>
                    <ArrowUpRight size={14} weight="bold" className="ml-auto shrink-0 self-center text-neutral-400 desktop:opacity-0 desktop:group-hover:opacity-100 transition-opacity duration-150" />
                  </a>
                </FadeIn>
              );
              return null;
            })}
          </div>
        </section>

        {/* Footer — pfp + copyright + hash + weather */}
        <FadeIn delay={275}>
        <div className="flex items-center justify-between mt-[72px]">
          <div className="flex items-center gap-[4px]">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                <video
                  src="/images/pfp1.jpg"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-6 h-6 rounded-full object-cover"
                />
              </div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">rahul kumar 20 IN</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <WeatherIcon code={weather.code} size={24} />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">India</span>
          </div>
        </div>
        </FadeIn>
      </V2LeftContent>
      </DrawerNavProvider>
      </div>

      {/* Right column — carousel + contributions */}
      <FadeIn delay={50} className="order-[2] desktop:order-none desktop:sticky desktop:top-12">
        <WorkCarousel />

        <section className="mt-6 flex flex-col gap-3">
          <CommitGraph days={days} />
          <div className="flex items-center justify-between">
            <span className={metaLabel}>Last 30 days</span>
            <span className={`${metaLabel} tabular-nums`}>{totalCommits} contributions</span>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
