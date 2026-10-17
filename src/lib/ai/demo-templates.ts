import type { ArtifactType } from '@/types';

/**
 * Built-in artifacts streamed by /api/chat when no ANTHROPIC_API_KEY is set,
 * so the whole flow (stream → code tab → save → version → preview) works offline.
 */

interface DemoTemplate {
  keywords: RegExp;
  type: ArtifactType;
  title: string;
  intro: string;
  outro: string;
  code: string;
}

const TASK_MANAGER = `import { useMemo, useState } from 'react';
import { Check, Circle, Plus, Trash2, ListTodo, Flag } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
interface Task { id: number; title: string; done: boolean; priority: Priority; }
type Filter = 'all' | 'active' | 'done';

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-stone-100 text-stone-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Draft the Q4 roadmap', done: false, priority: 'high' },
    { id: 2, title: 'Review onboarding copy', done: true, priority: 'medium' },
    { id: 3, title: 'Book the team offsite venue', done: false, priority: 'low' },
  ]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () => tasks.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done)),
    [tasks, filter],
  );
  const remaining = tasks.filter((t) => !t.done).length;
  const progress = tasks.length ? Math.round(((tasks.length - remaining) / tasks.length) * 100) : 0;

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((prev) => [{ id: Date.now(), title: title.trim(), done: false, priority }, ...prev]);
    setTitle('');
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-stone-900 text-white">
            <ListTodo size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-stone-500">{remaining} remaining · {progress}% complete</p>
          </div>
        </header>

        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: progress + '%' }} />
        </div>

        <form onSubmit={addTask} className="mb-4 flex gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-stone-400"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2 text-sm text-stone-600 outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-stone-700">
            <Plus size={16} /> Add
          </button>
        </form>

        <div className="mb-3 flex gap-1 rounded-xl bg-stone-200/60 p-1 text-sm">
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={'flex-1 rounded-lg px-3 py-1.5 capitalize transition ' + (filter === f ? 'bg-white font-medium shadow-sm' : 'text-stone-500 hover:text-stone-800')}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {visible.map((task) => (
            <li key={task.id} className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <button
                onClick={() => setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))}
                className={'grid h-5 w-5 place-items-center rounded-full transition ' + (task.done ? 'bg-emerald-500 text-white' : 'text-stone-300 hover:text-stone-500')}
                aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
              >
                {task.done ? <Check size={13} strokeWidth={3} /> : <Circle size={20} />}
              </button>
              <span className={'flex-1 text-sm ' + (task.done ? 'text-stone-400 line-through' : '')}>{task.title}</span>
              <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ' + PRIORITY_STYLES[task.priority]}>
                <Flag size={11} /> {task.priority}
              </span>
              <button
                onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                className="text-stone-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="rounded-xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
              Nothing here yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
`;

const DASHBOARD = `import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Users, ShoppingBag, Activity } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REVENUE = [42, 48, 45, 53, 61, 58, 66, 72, 69, 78, 84, 91];
const ORDERS = [310, 342, 330, 371, 402, 390, 428, 455, 441, 489, 512, 548];

const CHANNELS = [
  { name: 'Organic search', value: 38, color: '#d97706' },
  { name: 'Direct', value: 26, color: '#57534e' },
  { name: 'Email', value: 21, color: '#0d9488' },
  { name: 'Paid social', value: 15, color: '#a8a29e' },
];

const ORDERS_TABLE = [
  { id: '#4821', customer: 'Northwind Co.', total: 1240, status: 'Paid' },
  { id: '#4820', customer: 'Lumen Studio', total: 860, status: 'Pending' },
  { id: '#4819', customer: 'Harbor & Pine', total: 2310, status: 'Paid' },
  { id: '#4818', customer: 'Atlas Labs', total: 415, status: 'Refunded' },
  { id: '#4817', customer: 'Cedar Health', total: 1975, status: 'Paid' },
];

function Kpi({ label, value, delta, icon: Icon }: { label: string; value: string; delta: number; icon: typeof DollarSign }) {
  const up = delta >= 0;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm text-stone-500">
        {label}
        <Icon size={16} className="text-stone-400" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className={'mt-1 inline-flex items-center gap-1 text-xs font-medium ' + (up ? 'text-emerald-600' : 'text-rose-600')}>
        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(delta)}% vs last period
      </div>
    </div>
  );
}

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 640, h = 220, pad = 28;
  const max = Math.max(...data) * 1.1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const path = data.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' ');
  const area = path + ' L' + x(data.length - 1) + ' ' + (h - pad) + ' L' + x(0) + ' ' + (h - pad) + ' Z';
  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} className="w-full" onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={pad} x2={w - pad} y1={y(max * t)} y2={y(max * t)} stroke="#e7e5e4" strokeDasharray="3 4" />
      ))}
      <path d={area} fill="url(#fill)" />
      <path d={path} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <g key={i} onMouseEnter={() => setHover(i)}>
          <rect x={x(i) - 20} y={0} width={40} height={h} fill="transparent" />
          <text x={x(i)} y={h - 8} textAnchor="middle" fontSize="11" fill="#a8a29e">{labels[i]}</text>
          {hover === i && (
            <g>
              <line x1={x(i)} x2={x(i)} y1={pad} y2={h - pad} stroke="#d6d3d1" />
              <circle cx={x(i)} cy={y(v)} r="5" fill="#fff" stroke="#d97706" strokeWidth="2.5" />
              <rect x={x(i) - 34} y={y(v) - 38} width="68" height="26" rx="7" fill="#1c1917" />
              <text x={x(i)} y={y(v) - 21} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600">{'$' + v + 'k'}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState<6 | 12>(12);
  const slice = useMemo(() => ({
    revenue: REVENUE.slice(-range),
    orders: ORDERS.slice(-range),
    labels: MONTHS.slice(-range),
  }), [range]);
  const total = slice.revenue.reduce((a, b) => a + b, 0);
  const orders = slice.orders.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-stone-50 p-6 text-stone-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">Overview</p>
            <h1 className="text-2xl font-semibold tracking-tight">Sales performance</h1>
          </div>
          <div className="flex rounded-xl bg-stone-200/60 p-1 text-sm">
            {[6, 12].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as 6 | 12)}
                className={'rounded-lg px-3 py-1.5 transition ' + (range === r ? 'bg-white font-medium shadow-sm' : 'text-stone-500')}
              >
                Last {r} months
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Revenue" value={'$' + total + 'k'} delta={12.4} icon={DollarSign} />
          <Kpi label="Orders" value={orders.toLocaleString()} delta={8.1} icon={ShoppingBag} />
          <Kpi label="Customers" value="3,284" delta={5.6} icon={Users} />
          <Kpi label="Conversion" value="3.9%" delta={-0.4} icon={Activity} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-1 font-medium">Monthly revenue</h2>
            <p className="mb-4 text-sm text-stone-500">Hover the chart for monthly values.</p>
            <LineChart data={slice.revenue} labels={slice.labels} />
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-medium">Traffic by channel</h2>
            <div className="space-y-4">
              {CHANNELS.map((c) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="tabular-nums text-stone-500">{c.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full" style={{ width: c.value + '%', background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <h2 className="border-b border-stone-200 px-5 py-4 font-medium">Recent orders</h2>
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr><th className="px-5 py-2.5 font-medium">Order</th><th className="px-5 py-2.5 font-medium">Customer</th><th className="px-5 py-2.5 text-right font-medium">Total</th><th className="px-5 py-2.5 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {ORDERS_TABLE.map((o) => (
                <tr key={o.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-5 py-3 font-mono text-xs text-stone-500">{o.id}</td>
                  <td className="px-5 py-3">{o.customer}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{'$' + o.total.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + (o.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : o.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600')}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
`;

const WEBSITE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fieldnote — Coffee roasted to order</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap');
    body { font-family: Inter, system-ui, sans-serif; }
    .serif { font-family: Fraunces, Georgia, serif; }
  </style>
</head>
<body class="bg-[#f7f3ee] text-stone-900">
  <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
    <a href="#" class="serif text-2xl font-bold tracking-tight">Fieldnote</a>
    <nav class="hidden gap-8 text-sm text-stone-600 md:flex">
      <a href="#beans" class="hover:text-stone-900">Beans</a>
      <a href="#how" class="hover:text-stone-900">How it works</a>
      <a href="#faq" class="hover:text-stone-900">FAQ</a>
    </nav>
    <a href="#beans" class="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Start a subscription</a>
  </header>

  <section class="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
    <div>
      <p class="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-amber-700">Small-batch · Roasted Mondays</p>
      <h1 class="serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">Coffee that tastes like where it came from.</h1>
      <p class="mt-6 max-w-md text-lg text-stone-600">We buy directly from twelve farms, roast to order, and ship within 48 hours so every bag arrives at its peak.</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="#beans" class="rounded-full bg-amber-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-amber-700">Shop this week's roast</a>
        <a href="#how" class="rounded-full border border-stone-300 px-6 py-3 font-medium hover:bg-white">How it works</a>
      </div>
    </div>
    <div class="relative aspect-square rounded-[2rem] bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 p-8">
      <div class="absolute inset-8 rounded-[1.5rem] bg-[#3b2a20] shadow-2xl"></div>
      <div class="absolute bottom-14 left-14 right-14 rounded-2xl bg-[#f7f3ee] p-5 shadow-lg">
        <p class="text-xs uppercase tracking-widest text-stone-500">This week</p>
        <p class="serif mt-1 text-2xl font-bold">Huila, Colombia</p>
        <p class="mt-1 text-sm text-stone-600">Red apple · panela · cocoa nib</p>
      </div>
    </div>
  </section>

  <section id="beans" class="bg-white py-20">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="serif text-3xl font-bold md:text-4xl">This month's lineup</h2>
      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <article class="rounded-3xl border border-stone-200 p-6 transition hover:-translate-y-1 hover:shadow-lg">
          <div class="mb-6 h-40 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-300"></div>
          <h3 class="serif text-xl font-bold">Huila</h3><p class="text-sm text-stone-500">Colombia · Washed</p>
          <div class="mt-4 flex items-center justify-between"><span class="font-semibold">$19</span><button class="rounded-full bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700">Add</button></div>
        </article>
        <article class="rounded-3xl border border-stone-200 p-6 transition hover:-translate-y-1 hover:shadow-lg">
          <div class="mb-6 h-40 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-300"></div>
          <h3 class="serif text-xl font-bold">Guji</h3><p class="text-sm text-stone-500">Ethiopia · Natural</p>
          <div class="mt-4 flex items-center justify-between"><span class="font-semibold">$22</span><button class="rounded-full bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700">Add</button></div>
        </article>
        <article class="rounded-3xl border border-stone-200 p-6 transition hover:-translate-y-1 hover:shadow-lg">
          <div class="mb-6 h-40 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-300"></div>
          <h3 class="serif text-xl font-bold">Cerrado</h3><p class="text-sm text-stone-500">Brazil · Pulped natural</p>
          <div class="mt-4 flex items-center justify-between"><span class="font-semibold">$17</span><button class="rounded-full bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700">Add</button></div>
        </article>
      </div>
    </div>
  </section>

  <section id="how" class="mx-auto max-w-6xl px-6 py-20">
    <h2 class="serif text-3xl font-bold md:text-4xl">How it works</h2>
    <ol class="mt-10 grid gap-8 md:grid-cols-3">
      <li><span class="serif text-4xl text-amber-600">01</span><h3 class="mt-2 font-semibold">Pick your beans</h3><p class="mt-1 text-stone-600">Choose a single origin or let us rotate for you.</p></li>
      <li><span class="serif text-4xl text-amber-600">02</span><h3 class="mt-2 font-semibold">We roast Monday</h3><p class="mt-1 text-stone-600">Every order is roasted fresh in small batches.</p></li>
      <li><span class="serif text-4xl text-amber-600">03</span><h3 class="mt-2 font-semibold">Brew by Thursday</h3><p class="mt-1 text-stone-600">Free shipping, pause or skip any time.</p></li>
    </ol>
  </section>

  <footer class="border-t border-stone-200 py-10 text-center text-sm text-stone-500">© Fieldnote Coffee Roasters</footer>
</body>
</html>
`;

const DOCUMENT = `# Product Requirements: Shared Workspaces

**Owner:** Product · **Status:** Draft · **Target release:** Q1

## Summary

Shared workspaces let a team collaborate on chats and artifacts in one place. Members see each other's artifacts, comment on versions, and publish to a shared gallery.

## Goals

- Reduce the time it takes a team to go from idea to reviewed prototype.
- Make every artifact traceable: who changed what, and with which prompt.
- Keep permissions simple enough to explain in one sentence.

## Non-goals

- Real-time co-editing inside the code editor.
- Fine-grained, per-file permissions.

## User stories

| As a… | I want to… | So that… |
| --- | --- | --- |
| Designer | share a prototype link with my team | I get feedback without a meeting |
| Engineer | see the prompt behind each version | I can reproduce or refine it |
| Lead | see what the team built this week | I can spot work worth investing in |

## Requirements

1. **Workspace membership.** Owners invite members by email; members can create chats and artifacts.
2. **Version comments.** Any member can comment on a specific artifact version.
3. **Activity feed.** A chronological feed of new artifacts and versions.

## Open questions

- Should published artifacts default to workspace-only or public?
- Do we need an audit export for enterprise customers?

> Next step: review with design and engineering, then size the work.
`;

const SPREADSHEET = `Month,Revenue,Expenses,Profit,Margin
January,"$42,000","$31,500","$10,500",25.0%
February,"$48,000","$33,100","$14,900",31.0%
March,"$45,000","$32,800","$12,200",27.1%
April,"$53,000","$35,900","$17,100",32.3%
May,"$61,000","$39,400","$21,600",35.4%
June,"$58,000","$38,700","$19,300",33.3%
July,"$66,000","$41,200","$24,800",37.6%
August,"$72,000","$43,900","$28,100",39.0%
September,"$69,000","$42,600","$26,400",38.3%
October,"$78,000","$46,300","$31,700",40.6%
November,"$84,000","$48,800","$35,200",41.9%
December,"$91,000","$52,100","$38,900",42.7%
`;

const PRESENTATION = `# Workspace
### From prompt to prototype in minutes

---

## The problem

- Ideas stall between the doc and the first prototype
- Feedback happens in screenshots and threads
- Nobody remembers which prompt produced which version

---

## What we built

- A chat on the left, a **live artifact** on the right
- Apps, dashboards, sites, docs, sheets and slides
- Every change saved as an immutable version

---

## How it works

1. Describe what you want
2. Watch the code stream into the editor
3. Preview runs in a sandboxed iframe
4. Edit, save, compare, restore

---

## Results from the pilot

| Metric | Before | After |
| --- | --- | --- |
| Idea → prototype | 3 days | 40 min |
| Review rounds | 4 | 2 |

---

## Next steps

- Shared team workspaces
- Comments on versions
- One-click deploy
`;

const TEMPLATES: DemoTemplate[] = [
  {
    keywords: /dashboard|analytics|metrics|kpi|chart/i,
    type: 'dashboard',
    title: 'Sales Dashboard',
    intro: "Here's a sales dashboard with KPI cards, an interactive revenue chart, channel breakdown and recent orders.",
    outro: 'Toggle between 6 and 12 months, or hover the chart. Try asking for a different color palette or extra filters.',
    code: DASHBOARD,
  },
  {
    keywords: /website|landing|site|homepage|web page/i,
    type: 'website',
    title: 'Fieldnote Landing Page',
    intro: "Here's a landing page for a small-batch coffee roaster: hero, product grid, how-it-works and footer.",
    outro: 'Edit the copy in the Code tab and the preview updates as you type.',
    code: WEBSITE,
  },
  {
    keywords: /spreadsheet|sheet|csv|table|budget|p&l/i,
    type: 'spreadsheet',
    title: 'Monthly P&L',
    intro: "Here's a monthly profit-and-loss sheet.",
    outro: 'Click any cell to edit it. Changes are saved as a draft you can commit as a new version.',
    code: SPREADSHEET,
  },
  {
    keywords: /presentation|slides|deck|pitch/i,
    type: 'presentation',
    title: 'Workspace Pitch',
    intro: "Here's a short pitch deck.",
    outro: 'Use the arrow keys to move between slides.',
    code: PRESENTATION,
  },
  {
    keywords: /document|doc|prd|spec|memo|report|write/i,
    type: 'document',
    title: 'Shared Workspaces PRD',
    intro: "Here's a product requirements document.",
    outro: 'Ask for another section, a different tone, or a shorter version.',
    code: DOCUMENT,
  },
  {
    keywords: /task|todo|to-do|app|tracker|manager/i,
    type: 'react',
    title: 'Task Manager',
    intro: "Here's a task manager with priorities, filters and progress tracking.",
    outro: 'Add, complete and delete tasks in the preview. Try asking for due dates or drag-to-reorder.',
    code: TASK_MANAGER,
  },
];

export const DEMO_NOTICE =
  'Running in demo mode. Add `ANTHROPIC_API_KEY` to `.env.local` for real generation.';

/** Build the full demo reply for a prompt. */
export function demoReply(prompt: string, hasArtifact: boolean): string {
  const template = TEMPLATES.find((t) => t.keywords.test(prompt));
  if (!template) {
    if (hasArtifact) {
      return `I can't edit artifacts in demo mode. ${DEMO_NOTICE}\n\nYou can still edit the code yourself in the **Code** tab and save it as a new version with ⌘S.`;
    }
    return `${DEMO_NOTICE}\n\nIn demo mode I can build a few built-in examples. Try one of these:\n\n- **Build a task manager**\n- **Make a sales dashboard**\n- **Create a landing page for a coffee roaster**\n- **Write a product requirements doc**\n- **Make a monthly P&L spreadsheet**\n- **Create a pitch deck**`;
  }
  return `${template.intro}\n\n<artifact type="${template.type}" title="${template.title}">\n${template.code}</artifact>\n\n${template.outro}`;
}

/** Split a reply into small chunks that stream like a model would. */
export function chunkForStreaming(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const size = 18 + Math.floor(Math.random() * 40);
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}
